import * as models from '../../../db/models/index.js';
import httpStatus from 'http-status';
import { responseHelper } from '../../../utils/response.helper.js';
import { body, validationResult } from 'express-validator';
import { removeMulterFiles } from '../../../utils/fs.helper.js';
import { unlinkSync } from 'fs';
import { generatePasswordHash } from '../../../utils/encryption.helper.js';
import { sendMail } from '../../../utils/mail.helper.js';
import { createAccountTemplate } from '../../../registry/mail-templates/create-account.template.js';
import { inviteAccountTemplate } from '../../../registry/mail-templates/invite-create-account.template.js';
import { generateRandomPassword } from '../../../utils/generate-random-password.helper.js';
import { extractSiteInfo, extractColors } from '../../../utils/ai/ai-helper.js';
import { Types } from 'mongoose';
import { paginateData } from '../../../utils/paginate-data.js';
import { calculateClientRelevance } from '../../../utils/client-search.helper.js';
const defaultClientImagePath = '/cdn/images/user.png';
const defaultLogoImagePath = '/cdn/images/logo2.png';
const defaultWaterMarkImagePath = '/cdn/images/logo3.jpg';
const defaultPageLimit = process.env.PAGE_LIMIT;

export async function create(req, res, next) {
  try {
    // if (req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }

    const {
      firstName,
      lastName,
      email,
      primaryContactNo,
      primaryIsdCode,
      secContactNo,
      secIsdCode,
      country,
      brandUrl,
      brandName,
      brandDescription,
      brandColorCode,
      subheadingColourCode,
      descriptionColorCode,
      adGoals,
      toneOfVoice,
      targetAudience,
      productServiceName,
      briefDescription,
      mainBrandColor,
      brandKitSubheadingCode,
      brandKitDescriptionColorCode,
      alternateColor,
      brandFont,
    } = req.body;
    const validations = [
      body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 3, max: 30 })
        .withMessage('First name must be between 3 and 30 characters')
        .matches(/^[a-zA-Z\s.]+$/)
        .withMessage(`First name is invalid '${firstName}'`)
        .trim()
        .escape(),

      body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 1, max: 30 })
        .withMessage('Last name must be between 1 and 30 characters')
        .matches(/^[a-zA-Z\s.]+$/)
        .withMessage(`Last name is invalid '${lastName}'`)
        .trim()
        .escape(),
      body('email').isEmail().normalizeEmail(),
      body('primaryContactNo').notEmpty().isMobilePhone(),
      body('primaryIsdCode').notEmpty().isNumeric(),
      body('country').notEmpty().isString(),
    ];

    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Validation failed',
        errors.array()
      );
    }

    let urlExists;

    if (brandUrl !== undefined) {
      urlExists = await models.clientModel.findOne({ brandUrl });

      if (urlExists) {
        await removeMulterFiles(req.files);
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'This brand URL already exists'
        );
      }
    }

    const emailExists = await models.clientModel.findOne({ email });

    if (emailExists) {
      await removeMulterFiles(req.files);
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Client email already exists'
      );
    }
    const passcode = generateRandomPassword();
    const transformedData = [];
    let index = 0;

    while (req.body[`clientSocialMedia[${index}].media`]) {
      transformedData.push({
        media: req.body[`clientSocialMedia[${index}].media`],
        mediaToken: req.body[`clientSocialMedia[${index}].mediaToken`],
      });
      index++;
    }

    const hasDuplicates = transformedData.some(
      (item, currentIndex) =>
        transformedData.findIndex(
          (otherItem) => otherItem.mediaToken === item.mediaToken
        ) !== currentIndex
    );
    if (hasDuplicates)
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Social media token can not be the same.',
        {}
      );

    const {
      clientImage,
      logoImage,
      waterMarkImage,
      template,
      brandKitLogo,
      brandPattern,
    } = req.files;
    let templatePaths =
      template && Array.isArray(template) && template.length > 0
        ? template.map((t) => ({
            template: {
              name: t.originalname,
              fileName: t.filename,
              path: '/cdn/uploads/images/' + t.filename,
              uploadedDate: new Date(),
            },
          }))
        : [];

    let picture = {};
    const extractImageData = (image, defaultImagePath) => {
      if (image && image[0]) {
        return (picture = {
          name: image[0].originalname,
          fileName: image[0].filename,
          path: '/cdn/uploads/images/' + image[0].filename,
          uploadedDate: new Date(),
        });
      } else {
        return defaultImagePath;
      }
    };
    const getImageData = (clientImage, logoImage, waterMarkImage) => {
      return {
        clientImage: extractImageData(clientImage, defaultClientImagePath),
        logoImage: extractImageData(logoImage, defaultLogoImagePath),
        waterMarkImage: extractImageData(
          waterMarkImage,
          defaultWaterMarkImagePath
        ),
      };
    };

    getImageData(clientImage, logoImage, waterMarkImage);

    const extractBrandPatternPaths = (brandPattern) =>
      brandPattern && Array.isArray(brandPattern) && brandPattern.length > 0
        ? brandPattern.map((t) => ({
            pattern: {
              name: t.originalname,
              fileName: t.filename,
              path: '/cdn/uploads/images/' + t.filename,
              uploadedDate: new Date(),
            },
          }))
        : [];

    let brandPatternPath = extractBrandPatternPaths(brandPattern);
    const brandKitData = {
      logo:
        brandKitLogo && brandKitLogo[0]
          ? {
              name: brandKitLogo[0].originalname,
              fileName: brandKitLogo[0].filename,
              path: '/cdn/uploads/images/' + brandKitLogo[0].filename,
              uploadedDate: new Date(),
            }
          : null,
      mainBrandColor,
      brandKitSubheadingCode,
      brandKitDescriptionColorCode,
      alternativeColorCode: alternateColor,
      brandPattern: brandPatternPath,
      brandFont: brandFont
        ? brandFont.split(',').map((font) => font.trim())
        : [],
    };
    let clientBriefData = {};
    if (toneOfVoice || adGoals) {
      let goal = await models.adGoalModel.findById(adGoals);
      if (!goal)
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'Goal not found'
        );
      let tone = await models.toneOfVoiceModel.findById(toneOfVoice);
      if (!tone)
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'Tone of voice not found'
        );
      clientBriefData = {
        adGoals: goal._id,
        toneOfVoice: tone._id,
        targetAudience,
        productServiceName,
        briefDescription,
      };
    }
    let role = await models.roleModel.findOne({ roleName: 'client' });

    let client;
    if (req.files && Object.keys(req.files).length > 0) {
      const clientDataWithFiles = {
        firstName,
        lastName,
        email,
        password: await generatePasswordHash(passcode),
        primaryContactNo,
        primaryIsdCode,
        secContactNo,
        secIsdCode,
        roleId: role._id,
        country,
        brandUrl,
        brandName,
        brandDescription,
        brandColorCode,
        subheadingColorCode: subheadingColourCode,
        descriptionColorCode,
        ...getImageData(clientImage, logoImage, waterMarkImage),
        clientBrief: Object.values(clientBriefData).some(
          (value) => value !== null && value !== undefined
        )
          ? clientBriefData
          : null,
        brandKit: Object.values(brandKitData).some(
          (value) => value !== null && value !== undefined
        )
          ? brandKitData
          : null,
        templates: templatePaths,
        clientSocialMedia: transformedData,
      };

      client = await models.clientModel.create(clientDataWithFiles);
    } else {
      const clientDataWithoutFiles = {
        firstName,
        lastName,
        email,
        password: await generatePasswordHash(passcode),
        primaryContactNo,
        primaryIsdCode,
        secContactNo,
        secIsdCode,
        roleId: role._id,
        country,
        brandUrl,
        brandName,
        brandDescription,
        brandColorCode,
        subheadingColorCode: subheadingColourCode,
        descriptionColorCode,
        clientBrief: Object.values(clientBriefData).some(
          (value) => value !== null && value !== undefined
        )
          ? clientBriefData
          : null,
        clientSocialMedia: transformedData,
      };

      client = await models.clientModel.create(clientDataWithoutFiles);
    }

    let clientName = firstName + ' ' + lastName;
    const frontendUrl = process.env.FRONTEND_URL + '/auth/login';
    const subject = 'Account created successfully';
    console.log(frontendUrl);
    const content = createAccountTemplate(
      clientName,
      email,
      passcode,
      frontendUrl
    );

    const mailResponse = await sendMail(email, subject, content);

    await models.emailSendModel.create({
      to: email,
      messageId: mailResponse.messageId,
      subject,
      content,
    });

    const responses = [];
    let conflictError = false;
    let count = 0;

    if (req.body[`data[${count}].clientUserName`]) {
      try {
        const dataKeys = Object.keys(req.body).filter((key) =>
          key.startsWith('data[')
        );

        const clientUserResponses = [];
        for (const key of dataKeys) {
          const countMatch = key.match(/\[(\d+)\]/);
          const count = countMatch ? parseInt(countMatch[1]) : null;

          if (count !== null && !conflictError) {
            const clientUserName = req.body[`data[${count}].clientUserName`];
            const clientUserEmail = req.body[`data[${count}].clientUserEmail`];
            const view = req.body[`data[${count}].view`];
            const action = req.body[`data[${count}].action`];
            const emailExists = await models.clientUserModel.findOne({
              clientUserEmail: clientUserEmail,
            });
            if (emailExists) {
              responses.push({
                status: httpStatus.CONFLICT,
                error: true,
                message: `This client-user email ${clientUserEmail} already exists`,
              });
              conflictError = true;
              break;
            } else if (clientUserEmail === client.email) {
              responses.push({
                status: httpStatus.CONFLICT,
                error: true,
                message:
                  'Client email and client user email cannot be the same',
              });
              conflictError = true;
              break;
            } else {
              clientUserResponses.push({
                clientUserName,
                clientUserEmail,
                view,
                action,
              });
            }
          }
        }
        const uniqueEmails = new Set();
        const values = [];

        for (const entry of clientUserResponses) {
          if (!uniqueEmails.has(entry.clientUserEmail)) {
            uniqueEmails.add(entry.clientUserEmail);
            values.push(entry);
          }
        }
        if (!conflictError) {
          const clientUserPromises = values.map(async (clientUserData) => {
            const { clientUserName, clientUserEmail, view, action } =
              clientUserData;
            const passcode = generateRandomPassword();
            const clientUserRole = await models.roleModel.findOne({
              roleName: 'client user',
            });

            const clientUser = await models.clientUserModel.create({
              clientUserName,
              clientUserEmail,
              password: await generatePasswordHash(passcode),
              clientId: client.id,
              view,
              roleId: clientUserRole._id,
              action,
            });

            const subject = 'Account created successfully';
            const content = createAccountTemplate(
              clientUserName,
              clientUserEmail,
              passcode
            );
            const mailResponse = await sendMail(
              clientUserEmail,
              subject,
              content
            );

            await models.emailSendModel.create({
              to: clientUserEmail,
              messageId: mailResponse.messageId,
              subject,
              content,
            });

            return {
              status: httpStatus.CREATED,
              error: false,
              message: 'Client user information recorded successfully',
              data: { clientUser },
            };
          });

          const resolvedClientUserPromises =
            await Promise.all(clientUserPromises);
          responses.push(...resolvedClientUserPromises);
        }
      } catch (error) {
        responses.push({
          status: httpStatus.INTERNAL_SERVER_ERROR,
          error: true,
          message: error.message,
        });
      }
    }

    if (conflictError) {
      await models.clientModel.findOneAndDelete({ _id: client.id });
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Conflict in client users',
        responses
      );
    } else {
      const responseClient = await models.clientModel
        .findById(client._id)
        .select('-password');

      return responseHelper(
        res,
        httpStatus.CREATED,
        false,
        'Added new client',
        {
          client: responseClient,
        }
      );
    }
  } catch (error) {
    return next(new Error(error));
  }
}

export async function list(req, res, next) {
  try {
    let { pageLimit, orderBy = 'createdAt', search = null, order } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    const page = parseInt(req.query.page) || 1;
    order = order == 'asc' ? 1 : -1;
    let sort = {};
    if (orderBy === 'clientName') {
      sort = { firstName: order };
    } else if (orderBy === 'companyName') {
      sort = { brandName: order };
    } else if (orderBy === 'companyUrl') {
      sort = { brandUrl: order };
    } else {
      sort = { createdAt: -1 }; // Default sorting by createdAt
    }
    const query = {};
    if (search) {
      query.$or = [
        { brandUrl: { $regex: new RegExp(search, 'i') } },
        { brandName: { $regex: new RegExp(search, 'i') } },
        { firstName: { $regex: new RegExp(search, 'i') } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: new RegExp(search, 'i'),
            },
          },
        },
        { lastName: { $regex: new RegExp(search, 'i') } },
      ];
    }
    const clients = await models.clientModel
      .find(query)
      .select('firstName lastName clientImage brandUrl brandName systemAccess')
      .sort(sort);

    if (search) {
      clients.sort((a, b) => {
        const aRelevance = calculateClientRelevance(a, search);
        const bRelevance = calculateClientRelevance(b, search);
        return bRelevance - aRelevance;
      });
    }
    const paginationResult = await paginateData(clients, page, pageLimit);
    //apply orderBy and order
    paginationResult.pagination.orderBy = orderBy;
    paginationResult.pagination.order = order;

    return responseHelper(res, httpStatus.OK, false, 'clients', {
      clients: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function findOne(req, res, next) {
  try {
    const { clientId } = req.params;
    const client = await models.clientModel.findById(clientId);
    const clientUser = await models.clientUserModel
      .find({ clientId: clientId })
      // .populate('clientId')
      .select('clientUserImage _id clientUserName clientUserEmail view action');
    if (!client) {
      await removeMulterFiles(req.files);
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client does not exists'
      );
    }
    return responseHelper(res, httpStatus.OK, false, '', {
      client,
      clientUser,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function inviteClientUser(req, res, next) {
  try {
    const { clientUserName, clientUserEmail, clientUserId } = req.body;

    const emailExists = await models.clientUserModel.findOne({
      clientUserEmail: clientUserEmail,
    });
    const clientEmail = await models.clientModel.findOne({
      email: clientUserEmail,
    });

    if (clientEmail) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Client email and client user email cannot be the same',
        {}
      );
    } else if (emailExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `This ${emailExists.clientUserEmail} email already exists`,
        {}
      );
    }

    const passcode = generateRandomPassword();

    if (
      clientUserId == undefined ||
      !clientUserId ||
      clientUserId == null ||
      clientUserId == ''
    ) {
      let role = await models.roleModel.findOne({ roleName: 'client user' });
      if (!role)
        return httpStatus(
          res,
          httpStatus.NOT_FOUND,
          true,
          'role not found',
          {}
        );
      await models.clientUserModel.create({
        clientUserName,
        clientUserEmail,
        password: await generatePasswordHash(passcode),
        roleId: role._id,
      });
      const frontendUrl = process.env.FRONTEND_URL + '/auth/login';
      const subject = 'Account created successfully';
      const content = createAccountTemplate(
        clientUserName,
        clientUserEmail,
        passcode,
        frontendUrl
      );
      const mailResponse = await sendMail(clientUserEmail, subject, content);
      //save email response in db
      await models.emailSendModel.create({
        to: clientUserEmail,
        messageId: mailResponse.messageId,
        subject,
        content,
      });
    } else {
      const frontendUrl = process.env.FRONTEND_URL + '/auth/login';
      const subject = 'Your email successfully changed';
      const content = inviteAccountTemplate(
        clientUserName,
        clientUserEmail,
        frontendUrl
      );
      const mailResponse = await sendMail(clientUserEmail, subject, content);
      //save email response in db
      await models.emailSendModel.create({
        to: clientUserEmail,
        messageId: mailResponse.messageId,
        subject,
        content,
      });
    }
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'client-user invite email is successfully sent.'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function enableOrDisableSystemAccess(req, res, next) {
  try {
    const { clientId } = req.params;
    const { systemAccess } = req.body;

    const client = await models.clientModel.findById(clientId);

    if (!client) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found'
      );
    }

    const updatedClient = await models.clientModel
      .findByIdAndUpdate(clientId, { $set: { systemAccess } }, { new: true })
      .select('firstName lastName clientImage email systemAccess');

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Client system access status updated successfully',
      { user: updatedClient }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function update(req, res, next) {
  try {
    // if (req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }

    const { clientId } = req.params;
    const {
      adGoals,
      toneOfVoice,
      productServiceName,
      targetAudience,
      briefDescription,
      mainBrandColor,
      brandKitSubheadingCode,
      brandKitDescriptionColorCode,
      alternativeColor,
      brandFont,
      ...otherFields
    } = req.body;

    const {
      logoImage,
      waterMarkImage,
      clientImage,
      brandKitLogo,
      newBrandPattern,
      newTemplate,
    } = req.files;

    const clientExist = await models.clientModel.findById(clientId);
    if (!clientExist)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found'
      );

    const existingBrandKit = await models.clientModel.findOne(
      { _id: clientId },
      { 'brandKit.$': 1 }
    );

    if (!existingBrandKit.brandKit) {
      existingBrandKit.brandKit = {};
    }

    let images = {};
    let logoToUpdate = existingBrandKit.brandKit.logo;
    let brandPatternPath = existingBrandKit.brandKit.brandPattern || [];
    let brandFontToUpdate = existingBrandKit.brandKit.brandFont;

    let templatePaths =
      newTemplate && Array.isArray(newTemplate) && newTemplate.length > 0
        ? newTemplate.map((t) => ({
            template: {
              name: t.originalname,
              fileName: t.filename,
              path: '/cdn/uploads/images/' + t.filename,
              uploadedDate: new Date(),
            },
          }))
        : [];

    if (brandKitLogo && brandKitLogo[0]) {
      logoToUpdate = {
        name: brandKitLogo[0].originalname,
        fileName: brandKitLogo[0].filename,
        path: '/cdn/uploads/images/' + brandKitLogo[0].filename,
        uploadedDate: new Date(),
      };
    }

    const transformedData = [];
    let index = 0;

    while (req.body[`clientSocialMedia[${index}].media`]) {
      const media = req.body[`clientSocialMedia[${index}].media`];
      const mediaToken = req.body[`clientSocialMedia[${index}].mediaToken`];

      const tokenExists = await models.clientModel.exists({
        _id: clientId,
        'clientSocialMedia.mediaToken': mediaToken,
      });

      if (!tokenExists) {
        transformedData.push({ media, mediaToken });
      }

      index++;
    }

    if (
      newBrandPattern &&
      Array.isArray(newBrandPattern) &&
      newBrandPattern.length > 0
    ) {
      brandPatternPath = newBrandPattern.map((t) => ({
        pattern: {
          name: t.originalname,
          fileName: t.filename,
          path: '/cdn/uploads/images/' + t.filename,
          uploadedDate: new Date(),
        },
      }));
    }

    if (brandFont) {
      brandFontToUpdate = brandFont.split(',').map((font) => font.trim());
    }

    const client = await models.clientModel.findById(clientId);

    if (
      (logoImage && logoImage[0]) ||
      (waterMarkImage && waterMarkImage[0]) ||
      (clientImage && clientImage[0])
    ) {
      images = {
        waterMark: req.files.waterMarkImage
          ? {
              name: waterMarkImage[0].originalname,
              fileName: waterMarkImage[0].filename,
              path: '/cdn/uploads/images/' + waterMarkImage[0].filename,
              uploadedDate: new Date(),
            }
          : client.waterMarkImage,
        logo: req.files.logoImage
          ? {
              name: logoImage[0].originalname,
              fileName: logoImage[0].filename,
              path: '/cdn/uploads/images/' + logoImage[0].filename,
              uploadedDate: new Date(),
            }
          : client.logoImage,
        client: req.files.clientImage
          ? {
              name: clientImage[0].originalname,
              fileName: clientImage[0].filename,
              path: '/cdn/uploads/images/' + clientImage[0].filename,
              uploadedDate: new Date(),
            }
          : client.clientImage,
      };
    }

    const clientUsers = [];

    for (let i = 0; req.body[`data[${i}].clientUserEmail`]; i++) {
      const clientUserName = req.body[`data[${i}].clientUserName`];
      const clientUserEmail = req.body[`data[${i}].clientUserEmail`];
      const view = req.body[`data[${i}].view`];
      const action = req.body[`data[${i}].action`];
      const id = req.body[`data[${i}].clientUserId`];

      const updateData = {
        clientId,
        clientUserName,
        clientUserEmail,
        view,
        action,
      };
      if (id != undefined) {
        let cUserModel = await models.clientUserModel.findById(id);
        if (cUserModel.clientUserEmail != clientUserEmail) {
          let emailSend = await models.emailSendModel.findOne({
            to: clientUserEmail,
            subject: 'Your email successfully changed',
          });
          if (!emailSend)
            return responseHelper(
              res,
              httpStatus.NOT_FOUND,
              true,
              `Please invite ${clientUserEmail} client-user`
            );
        }

        const clientUser = await models.clientUserModel.findOneAndUpdate(
          { clientId, _id: id },
          { $set: updateData },
          { new: true, upsert: true }
        );

        clientUsers.push(clientUser);
      }

      if (id == undefined) {
        const clientUser2 = await models.clientUserModel.findOneAndUpdate(
          { clientUserEmail },
          { $set: { clientId, view, action } }
        );

        clientUsers.push(clientUser2);

        if (!clientUser2) {
          return responseHelper(
            res,
            httpStatus.NOT_FOUND,
            true,
            `Please invite the new ${clientUserEmail} client-user`
          );
        }
      }
    }

    const clients = await models.clientModel.findByIdAndUpdate(
      clientId,
      {
        ...otherFields,
        clientImage: images.client,
        logoImage: images.logo,
        waterMarkImage: images.waterMark,
        clientBrief: {
          adGoals,
          toneOfVoice,
          productServiceName,
          targetAudience,
          briefDescription,
        },
        $set: {
          'brandKit.logo': logoToUpdate,
          'brandKit.mainBrandColor': mainBrandColor,
          'brandKit.brandKitDescriptionColorCode': brandKitDescriptionColorCode,
          'brandKit.alternativeColorCode': alternativeColor,
          'brandKit.brandKitSubheadingCode': brandKitSubheadingCode,
          'brandKit.brandFont': brandFontToUpdate,
        },
        $push: {
          'brandKit.brandPattern': { $each: brandPatternPath },
          templates: { $each: templatePaths },
          clientSocialMedia: { $each: transformedData },
        },
      },
      { new: true }
    );

    if (!clients || !client)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client does not exist'
      );

    return responseHelper(res, httpStatus.OK, false, 'Client updated', {
      client: clients,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function remove(req, res, next) {
  try {
    // if (req.user.role != 'Project Manager') {
    //   return responseHelper(
    //     res,
    //     httpStatus.CONFLICT,
    //     true,
    //     'You have no permission to do this action.'
    //   );
    // }

    const { clientId } = req.params;
    const client = await models.clientModel.findByIdAndDelete(clientId);
    if (!client) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client does not exists'
      );
    }
    return responseHelper(res, httpStatus.OK, false, 'Client deleted');
  } catch (error) {
    return next(new Error(error));
  }
}
