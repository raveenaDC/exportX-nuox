import * as models from '../db/models/index.js';
import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import { body, validationResult } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { unlinkSync } from 'fs';
import { generatePasswordHash } from '../utils/encryption.helper.js';
import { sendMail } from '../utils/mail.helper.js';
import { createAccountTemplate } from '../registry/mail-templates/create-account.template.js';
import { inviteAccountTemplate } from '../registry/mail-templates/invite-create-account.template.js';
import { generateRandomPassword } from '../utils/generate-random-password.helper.js';
import { extractSiteInfo, extractColors } from '../utils/ai/ai-helper.js';
import { sendMailAndSaveResponse } from '../utils/db-helper/send-mail-and-save-response.js';
import { Types, model } from 'mongoose';
import { paginateData } from '../utils/paginate-data.js';
import {
  uppercaseFirstLetter,
  capitalizeEachWordFirstLetter,
} from '../utils/letter-case-change.helper.js';
const defaultClientImagePath = '/cdn/images/user.png';
const defaultLogoImagePath = '/cdn/images/logo2.png';
const defaultWaterMarkImagePath = '/cdn/images/logo3.jpg';
const defaultPageLimit = process.env.PAGE_LIMIT;

const extractClientUsersAndClientSocialMedias = (body) => {
  const clientSocialMedias = [];
  const clientUsers = [];

  for (const key in body) {
    if (key.startsWith('clientSocialMedia')) {
      const index = key.match(/\[(.*?)\]/)[1];
      if (!clientSocialMedias[index]) clientSocialMedias[index] = {};
      const subKey = key.split('.').pop();
      clientSocialMedias[index][subKey] = body[key];
    } else if (key.startsWith('data')) {
      const index = key.match(/\[(.*?)\]/)[1];
      if (!clientUsers[index]) clientUsers[index] = {};
      const subKey = key.split('.').pop();
      if (subKey === 'view' || subKey === 'action') {
        // Convert 'true'/'false' strings to boolean
        clientUsers[index][subKey] = body[key] === 'true';
      } else {
        clientUsers[index][subKey] = body[key];
      }
    }
  }
  return { clientSocialMedias, clientUsers };
};

const transFormImageUploadResponseArray = (imageResponseArray) => {
  return imageResponseArray.map((image) => ({
    name: image.originalname,
    fileName: image.filename,
    path: `/cdn/uploads/images/${image.filename}`,
    uploadedDate: new Date(),
  }));
};

export async function list(req, res, next) {
  try {
    let { pageLimit, orderBy = 'createdAt', search = null, order } = req.query;
    pageLimit = parseInt(pageLimit || defaultPageLimit);
    const page = parseInt(req.query.page) || 1;
    order = order == 'asc' ? 1 : -1;
    let sort = {};
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
      .select(
        'firstName lastName clientImage brandUrl brandName systemAccess createdAt'
      )
      .collation({ locale: 'en', strength: 2 });

    if (orderBy === 'clientName') {
      clients.sort((a, b) => a.firstName.localeCompare(b.firstName) * order);
    } else if (orderBy === 'companyName') {
      clients.sort((a, b) => a.brandName.localeCompare(b.brandName) * order);
    } else if (orderBy === 'companyUrl') {
      clients.sort((a, b) => a.brandUrl.localeCompare(b.brandUrl) * order);
    } else {
      clients.sort((a, b) => (a.createdAt - b.createdAt) * order); // Default sorting by createdAt
    }

    if (search) {
      // Define a function to calculate relevance score
      const calculateRelevance = (client) => {
        const fields = ['brandName', 'brandUrl', 'firstName', 'lastName'];
        let relevance = 0;
        fields.forEach((field) => {
          if (
            client[field] &&
            client[field].toLowerCase().startsWith(search.toLowerCase())
          ) {
            relevance++;
          }
        });
        return relevance;
      };
      clients.sort((a, b) => calculateRelevance(b) - calculateRelevance(a));
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

export async function get(req, res, next) {
  try {
    const { clientId } = req.params;
    const client = await models.clientModel.findById(clientId);
    const clientBrand = await models.clientBrandInfoModel.find({
      clientId: clientId,
    });
    let clientUser = await models.clientUserModel
      .find({ clientId: clientId })
      .select('clientUserImage clientUserName clientUserEmail view action');
    if (!client) {
      await removeMulterFiles(req.files);
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client does not exists'
      );
    }
    // Remove template property from client and store it in a variable
    const { template, ...clientData } = client.toObject();

    // Concatenate emptyTemplate with client
    const clientInfo = {
      ...clientData,
      clientBrands: clientBrand ? clientBrand : '',
      emptyTemplate: template.map((templateArray, index) => ({
        index: index,
        templates: templateArray,
      })),
    };
    const clientUserIndex = clientUser.findIndex(
      (user) => user.clientUserEmail === client.email
    );
    if (clientUserIndex !== -1) {
      const user = clientUser.splice(clientUserIndex, 1)[0];
      clientUser.unshift(user);
    }

    return responseHelper(res, httpStatus.OK, false, '', {
      client: clientInfo,
      clientUser,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

export async function scanUrl(req, res, next) {
  try {
    const { brandUrl } = req.body;
    if (!brandUrl)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Please provide brand url',
        {}
      );
    let urlInfo = await extractSiteInfo(brandUrl);
    return responseHelper(res, httpStatus.OK, false, '', { urlInfo });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function extractColor(req, res, next) {
  try {
    const logoImage = req.files;
    if (!logoImage)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        'Please provide logo image',
        {}
      );
    let colors = await extractColors(logoImage);
    return responseHelper(res, httpStatus.OK, false, 'success', { colors });
  } catch (error) {
    return next(new Error(error));
  }
}
export async function create(req, res, next) {
  try {
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
      data,
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
      body('email')
        .notEmpty()
        .withMessage('Email is required')
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/)
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .trim()
        .escape(),
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

    const userExists = await models.userModel.findOne({ email });
    if (userExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'The client email is already in use. Please select another one.'
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
      //alternativeColorCode: alternateColor,
      alternativeColorCode: alternateColor
        ? alternateColor.split(',').map((color) => color.trim())
        : [],
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

    if (
      req.body[`data[${count}].clientUserName`] ||
      req.body[`data[${count}].clientUserEmail`]
    ) {
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

            const validators = [
              body(`data[${count}].clientUserName`)
                .if(
                  (value, { req }) => req.body[`data[${count}].clientUserName`]
                )
                .notEmpty()
                .withMessage('Client user name is required')
                .isLength({ min: 3, max: 30 })
                .withMessage(
                  'Client user name must be between 3 and 30 characters'
                )
                .matches(/^[a-zA-Z\s.]+$/)
                .withMessage(`Invalid client-user name '${clientUserName}'`)
                .trim()
                .escape(),
              body(`data[${count}].clientUserEmail`)
                .if(
                  (value, { req }) =>
                    req.body[`data[${count}].clientUserEmail`] !== undefined
                )
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Invalid email address')
                .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}$/)
                .withMessage('Invalid email address format')
                .normalizeEmail()
                .trim()
                .escape(),
            ];

            await Promise.all(
              validators.map((validation) => validation.run(req))
            );

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
              conflictError = true;
              responses.push({
                status: httpStatus.CONFLICT,
                error: true,
                message: `Validation failed for client-user ${clientUserName}`,
                errors: errors.array(),
              });
              break;
            }
            if (clientUserEmail && !clientUserName) {
              responses.push({
                status: httpStatus.CONFLICT,
                error: true,
                message: `Require client-user name for ${clientUserEmail}`,
              });
              conflictError = true;
              break;
            }
            if (!clientUserEmail && clientUserName) {
              responses.push({
                status: httpStatus.CONFLICT,
                error: true,
                message: `Require client-user email for ${clientUserName}`,
              });
              conflictError = true;
              break;
            }

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
                message: 'client and client-user email can not be the same',
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
              isInvite: true,
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
      await models.clientUserModel.create({
        clientUserName: clientName,
        clientUserEmail: client.email,
        password: client.password,
        // clientId:client._id,
        roleId: role._id,
        isInvite: true,
      });
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

export async function createNew(req, res, next) {
  try {
    const {
      firstName,
      lastName,
      primaryIsdCode,
      primaryContactNo,
      country,
      email,
      brandUrl,
      adGoals,
      toneOfVoice,
      emptyTemplate,
      brandInfo,
    } = req.body;
    const capitalizedFirstName = await uppercaseFirstLetter(firstName);
    const capitalizedLastName = await uppercaseFirstLetter(lastName);
    const fullName = `${capitalizedFirstName} ${capitalizedLastName}`;

    const userExists = await models.userModel.findOne({ email });
    if (userExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'The client email is already in use.Please choose another'
      );
    }
    const clientUserExists = await models.clientUserModel.findOne({
      clientUserEmail: email,
    });
    if (clientUserExists) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'The client email is already in use.Please choose another'
      );
    }
    const emailCheck = await models.clientModel.findOne({ email });
    if (emailCheck) {
      await removeMulterFiles(req.files);
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        `client email already exists (${email})`
      );
    }
    //check url already exists in db
    if (brandUrl) {
      const urlCheck = await models.clientModel.findOne({ brandUrl });
      if (urlCheck) {
        await removeMulterFiles(req.files);
        return responseHelper(
          res,
          httpStatus.CONFLICT,
          true,
          'brandUrl already exists'
        );
      }
    }
    //check adGoal
    if (adGoals) {
      const DBAdGoal = await models.adGoalModel.findById(adGoals);
      if (!DBAdGoal) {
        await removeMulterFiles(req.files);
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'adGoal not found'
        );
      }
    }
    //check tone of voice
    if (toneOfVoice) {
      const DBToneOfVoice = await models.toneOfVoiceModel.findById(toneOfVoice);
      if (!DBToneOfVoice) {
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'tone of voice not found'
        );
      }
    }

    const { clientSocialMedias, clientUsers } =
      extractClientUsersAndClientSocialMedias(req.body);

    //check mediaTokens
    if (clientSocialMedias) {
      for (const socialMedia of clientSocialMedias) {
        if (!socialMedia.mediaToken || !socialMedia.media) {
          await removeMulterFiles(req.files);
          return responseHelper(
            res,
            httpStatus.UNPROCESSABLE_ENTITY,
            true,
            'each clientSocialMedia must have mediaToken and media'
          );
        }
      }
    }
    //check clientUser
    if (clientUsers) {
      for (const clientUser of clientUsers) {
        if (!clientUser.clientUserName || !clientUser.clientUserEmail) {
          await removeMulterFiles(req.files);
          return responseHelper(
            res,
            httpStatus.UNPROCESSABLE_ENTITY,
            true,
            'each client-user must have client-user Name and client-user Email'
          );
        }
        clientUser.clientUserName = await capitalizeEachWordFirstLetter(
          clientUser.clientUserName
        );
      }
    }

    const role = await models.roleModel.findOne({ roleName: 'client' });
    const clientRandomPassword = generateRandomPassword();
    const client = await models.clientModel.create({
      firstName: capitalizedFirstName,
      lastName: capitalizedLastName,
      primaryIsdCode,
      primaryContactNo,
      country,
      email,
      password: await generatePasswordHash(clientRandomPassword),
      roleId: role?._id,
      brandKit: {
        brandFont: null,
        brandPattern: [],
        alternativeColorCode: null,
        brandKitSubheadingCode: null,
        logo: null,
        brandKitDescriptionColorCode: null,
        mainBrandColor: null,
      },
    });

    //brand Info array
    if (brandInfo) {
      const parsedBrandInfo = brandInfo;
      const brandInfoWithClientId = parsedBrandInfo.map((info) => {
        if (info.logos && info.logos.length > 0) {
          info.logos = transFormImageUploadResponseArray(info.logos);
        }
        info.brandAlternativeColorCode = Array.isArray(
          info.brandAlternativeColorCode
        )
          ? info.brandAlternativeColorCode
          : [];

        return {
          ...info,
          clientId: client._id,
        };
      });
      await models.clientBrandInfoModel.insertMany(brandInfoWithClientId);
    }

    //handle files
    const {
      clientImage,
      logoImage,
      waterMarkImage,
      template,
      brandKitLogo,
      brandPattern,
    } = req.files;

    if (clientImage && clientImage.length > 0) {
      client.clientImage = transFormImageUploadResponseArray(clientImage)[0];
    }
    if (logoImage && logoImage.length > 0) {
      client.logoImage = transFormImageUploadResponseArray(logoImage)[0];
    }
    if (waterMarkImage && waterMarkImage.length > 0) {
      client.waterMarkImage =
        transFormImageUploadResponseArray(waterMarkImage)[0];
    }
    if (template && template.length > 0) {
      client.templates = transFormImageUploadResponseArray(template).map(
        (template) => ({
          template,
        })
      );
    }

    if (brandKitLogo && brandKitLogo.length > 0) {
      client.brandKit.logo = transFormImageUploadResponseArray(brandKitLogo)[0];
    }
    if (brandPattern && brandPattern.length > 0) {
      const formattedBrandPattern = transFormImageUploadResponseArray(
        brandPattern
      ).map((pattern) => ({ pattern: { ...pattern } }));
      client.brandKit.brandPattern = formattedBrandPattern;
    }

    if (toneOfVoice && adGoals) {
      const { briefDescription, targetAudience, productServiceName } = req.body;
      client.clientBrief = {
        adGoals,
        toneOfVoice,
        briefDescription,
        targetAudience,
        productServiceName,
      };
    }
    if (clientSocialMedias && clientSocialMedias.length > 0) {
      client.clientSocialMedia = clientSocialMedias;
    }
    const {
      secContactNo,
      secIsdCode,
      brandName,
      brandDescription,
      brandColorCode,
      subheadingColourCode,
      descriptionColorCode,
      brandKitDescriptionColorCode,
      brandKitSubheadingCode,
      mainBrandColor,
      brandFont,
      alternateColor,
    } = req.body;
    client.template = emptyTemplate;
    client.secContactNo = secContactNo;
    client.secIsdCode = secIsdCode;
    client.brandUrl = brandUrl;
    client.brandName = brandName;
    client.brandDescription = brandDescription;
    client.brandColorCode = brandColorCode;
    client.subheadingColorCode = subheadingColourCode;
    client.descriptionColorCode = descriptionColorCode;

    //brand kit details
    client.brandKit.mainBrandColor = mainBrandColor;
    client.brandKit.brandKitSubheadingCode = brandKitSubheadingCode;
    client.brandKit.brandKitDescriptionColorCode = brandKitDescriptionColorCode;
    client.brandKit.alternativeColorCode = alternateColor
      ? alternateColor.split(',').map((color) => color.trim())
      : [];
    client.brandKit.brandFont = brandFont
      ? brandFont.split(',').map((font) => font.trim())
      : [];
    const frontendUrl = process.env.FRONTEND_URL + '/auth/login';
    await client.save();
    const clientUserRole = await models.roleModel.findOne({
      roleName: 'client user',
    });
    const mailSubject = 'Account created successfully';
    if (clientUsers && clientUsers.length > 0) {
      for (const clientUser of clientUsers) {
        const clientUserRandomPassword = generateRandomPassword();
        await models.clientUserModel.create({
          clientUserName: await capitalizeEachWordFirstLetter(
            clientUser.clientUserName
          ),
          clientUserEmail: clientUser.clientUserEmail,
          clientId: client._id,
          password: await generatePasswordHash(clientUserRandomPassword),
          roleId: clientUserRole._id,
          view: clientUser.view,
          action: clientUser.action,
          isInvite: true,
        });

        const mailContent = createAccountTemplate(
          clientUser.clientUserName,
          clientUser.clientUserEmail,
          clientUserRandomPassword,
          frontendUrl
        );
        await sendMailAndSaveResponse(
          mailSubject,
          mailContent,
          clientUser.clientUserEmail
        );
      }
    }

    //send registration mail to client
    const clientMailContent = createAccountTemplate(
      client.firstName,
      client.email,
      clientRandomPassword,
      frontendUrl
    );
    await sendMailAndSaveResponse(mailSubject, clientMailContent, client.email);
    //add client in client user
    await models.clientUserModel.create({
      clientUserName: `${client.firstName} ${client.lastName}`,
      clientUserEmail: client.email,
      password: client.password,
      roleId: role._id,
      isInvite: true,
      clientId: client.id,
      view: true,
      action: true,
    });

    const updatedClient = await models.clientModel
      .findById(client._id)
      .select('-password');
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      `created a new client successfully`
    );
  } catch (error) {
    console.log(error);
    next(new Error(error));
  }
}

export async function addBrandInfo(req, res, next) {
  try {
    const { clientId } = req.params;
    const {
      brandUrl,
      brandName,
      brandDescription,
      brandColorCode,
      subheadingColorCode,
      descriptionColorCode,
    } = req.body;
    // let urlInfo = await extractSiteInfo(brandUrl);
    // console.log(urlInfo.brandName);
    // console.log(urlInfo.description);
    // let colors = await extractColors(req.files.logoImage);
    //console.log(colors);
    const client = await models.clientModel.findById(clientId);
    if (!client) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found'
      );
    }
    if (client.brandUrl || client.brandName) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'BrandInfo already exist'
      );
    }
    const { logoImage, waterMarkImage } = req.files;
    const extractImageData = (image, defaultImagePath) => {
      if (image && image[0]) {
        return {
          name: image[0].originalname,
          fileName: image[0].filename,
          path: '/cdn/uploads/images/' + image[0].filename,
          uploadedDate: new Date(),
        };
      } else {
        return {
          path: defaultImagePath,
        };
      }
    };

    const getImageData = (logoImage, waterMarkImage) => {
      return {
        logoImage: extractImageData(logoImage, defaultLogoImagePath),
        waterMarkImage: extractImageData(
          waterMarkImage,
          defaultWaterMarkImagePath
        ),
      };
    };

    const imageData = getImageData(logoImage, waterMarkImage);
    let brandInfo = {
      brandUrl,
      brandName,
      brandDescription,
      brandColorCode,
      subheadingColorCode,
      descriptionColorCode,
      ...imageData,
    };
    client.brandUrl = brandInfo.brandUrl;
    client.brandName = brandInfo.brandName;
    client.brandDescription = brandInfo.brandDescription;
    client.brandColorCode = brandInfo.brandColorCode;
    client.subheadingColorCode = brandInfo.subheadingColorCode;
    client.descriptionColorCode = brandInfo.descriptionColorCode;
    client.logoImage = brandInfo.logoImage;
    client.waterMarkImage = brandInfo.waterMarkImage;

    await client.save();

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Added Brand Information',
      {
        client: client,
      }
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function update(req, res, next) {
  try {
    const { clientId } = req.params;
    const {
      firstName,
      lastName,
      adGoals,
      toneOfVoice,
      productServiceName,
      targetAudience,
      briefDescription,
      mainBrandColor,
      brandKitSubheadingCode,
      brandKitDescriptionColorCode,
      alternateColor,
      brandFont,
      subheadingColourCode,
      brandInfo,
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
    const capitalizedFirstName = await uppercaseFirstLetter(firstName);
    const capitalizedLastName = await uppercaseFirstLetter(lastName);
    const fullName = `${capitalizedFirstName} ${capitalizedLastName}`;

    const client = await models.clientModel.findById(clientId);
    if (!client)
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

    if (brandInfo) {
      const parsedBrandInfo = brandInfo;
      const transformedBrandInfo = parsedBrandInfo.map((info) => {
        if (info.logos && info.logos.length > 0) {
          let combinedLogo = [];
          info.logos.forEach((logo) => {
            if (logo.originalname) {
              const newLogos = transFormImageUploadResponseArray([logo]);
              combinedLogo = [...combinedLogo, ...newLogos];
            } else {
              combinedLogo.push(logo);
            }
          });
          info.logos = combinedLogo;
        }
        info.brandAlternativeColorCode = Array.isArray(
          info.brandAlternativeColorCode
        )
          ? info.brandAlternativeColorCode
          : [];
        return {
          ...info,
        };
      });

      for (const info of transformedBrandInfo) {
        await models.clientBrandInfoModel.findOneAndUpdate(
          { _id: info._id },
          info,
          { new: true, upsert: true }
        );
      }
    }

    let images = {};
    let logoToUpdate = existingBrandKit.brandKit.logo;
    let brandFontToUpdate = existingBrandKit.brandKit.brandFont;
    let alternativeColorToUpdate =
      existingBrandKit.brandKit.alternativeColorCode;
    const { clientSocialMedias, clientUsers } =
      extractClientUsersAndClientSocialMedias(req.body);
    if (clientSocialMedias) {
      for (const socialMedia of clientSocialMedias) {
        if (!socialMedia.mediaToken || !socialMedia.media) {
          await removeMulterFiles(req.files);
          return responseHelper(
            res,
            httpStatus.UNPROCESSABLE_ENTITY,
            true,
            'each clientSocialMedia must have mediaToken and media'
          );
        }
      }
    }
    if (clientUsers) {
      for (const clientUser of clientUsers) {
        if (!clientUser.clientUserName || !clientUser.clientUserEmail) {
          await removeMulterFiles(req.files);
          return responseHelper(
            res,
            httpStatus.UNPROCESSABLE_ENTITY,
            true,
            'each clientUser must have clientUserName and clientUserEmail'
          );
        }
      }
    }
    if (brandFont) {
      brandFontToUpdate = brandFont.split(',').map((font) => font.trim());
    }
    if (alternateColor) {
      console.log(alternateColor);
      alternativeColorToUpdate = alternateColor
        .split(',')
        .map((color) => color.trim());
    }
    if (
      (logoImage && logoImage[0]) ||
      (waterMarkImage && waterMarkImage[0]) ||
      (clientImage && clientImage[0])
    ) {
      images = {
        waterMark: req.files.waterMarkImage
          ? transFormImageUploadResponseArray(waterMarkImage)[0]
          : client.waterMarkImage,
        logo: req.files.logoImage
          ? transFormImageUploadResponseArray(logoImage)[0]
          : client.logoImage,
        client: req.files.clientImage
          ? transFormImageUploadResponseArray(clientImage)[0]
          : client.clientImage,
      };
    }
    let formattedBrandPattern = [],
      templatePaths = [];
    if (newBrandPattern && newBrandPattern.length > 0) {
      formattedBrandPattern = transFormImageUploadResponseArray(
        newBrandPattern
      ).map((pattern) => ({ pattern }));
    }
    let transformedData = [];
    if (clientSocialMedias && clientSocialMedias.length > 0) {
      for (const { media, mediaToken, _id } of clientSocialMedias) {
        const tokenExists = await models.clientModel.exists({
          _id: clientId,
          'clientSocialMedia.mediaToken': mediaToken,
        });
        const socialMediaIndex = client.clientSocialMedia.findIndex(
          (item) => item._id.toString() === _id
        );
        if (socialMediaIndex != -1) {
          client.clientSocialMedia[socialMediaIndex].media = media;
          client.clientSocialMedia[socialMediaIndex].mediaToken = mediaToken;
        }
        if (!tokenExists && !_id) {
          transformedData.push({ media, mediaToken });
        }
      }
    }
    if (newTemplate && newTemplate.length > 0) {
      templatePaths = newTemplate
        ? transFormImageUploadResponseArray(newTemplate).map((template) => ({
            template,
          }))
        : [];
    }
    if (brandKitLogo && brandKitLogo.length > 0) {
      logoToUpdate = transFormImageUploadResponseArray(brandKitLogo)[0];
    }
    const newClientUsers = [];
    if (clientUsers && clientUsers.length > 0) {
      for (const clientUser of clientUsers) {
        const clientUserName = await capitalizeEachWordFirstLetter(
          clientUser.clientUserName
        );
        const clientUserEmail = clientUser.clientUserEmail;
        const view = clientUser.view;
        const action = clientUser.action;
        const id = clientUser.clientUserId;
        const updateData = {
          clientId,
          clientUserName,
          clientUserEmail,
          view,
          action,
        };
        if (id != undefined) {
          // let cUserModel = await models.clientUserModel.findById(id);
          // if (cUserModel.clientUserEmail != clientUserEmail) {
          //   let emailSend = await models.emailSendModel.findOne({
          //     to: clientUserEmail,
          //     subject: 'Your email successfully changed',
          //   });
          //   if (!emailSend)
          //     return responseHelper(
          //       res,
          //       httpStatus.NOT_FOUND,
          //       true,
          //       `Please invite ${clientUserEmail} client-user`
          //     );
          // }
          const clientUser = await models.clientUserModel.findOneAndUpdate(
            { clientId, _id: id },
            { $set: updateData },
            { new: true, upsert: true }
          );
          newClientUsers.push(clientUser);
        }
        if (id == undefined) {
          let email = await models.clientUserModel.findOne({ clientUserEmail });
          if (!email || email.isInvite === false) {
            return responseHelper(
              res,
              httpStatus.NOT_FOUND,
              true,
              `Please invite the new ${clientUserEmail} client-user`
            );
          }
          const additionalUsers = await models.clientUserModel.findOneAndUpdate(
            { clientUserEmail },
            { $set: { clientId, view, action } },
            { new: true }
          );
          newClientUsers.push(additionalUsers);
        }
      }
    }
    const clients = await models.clientModel.findByIdAndUpdate(
      clientId,
      {
        firstName: capitalizedFirstName,
        lastName: capitalizedLastName,
        subheadingColorCode: subheadingColourCode,
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
          // 'brandKit.alternativeColorCode': alternateColor,
          'brandKit.alternativeColorCode': alternativeColorToUpdate,
          'brandKit.brandKitSubheadingCode': brandKitSubheadingCode,
          'brandKit.brandFont': brandFontToUpdate,
        },
        $push: {
          'brandKit.brandPattern': { $each: formattedBrandPattern },
          templates: { $each: templatePaths },
          clientSocialMedia: { $each: transformedData },
        },
        ...otherFields,
      },
      { new: true }
    );
    await client.save();
    await models.clientUserModel.findOneAndUpdate(
      {
        clientId: clientId,
        clientUserName: `${client.firstName} ${client.lastName}`,
      },
      {
        $set: {
          clientUserName: `${capitalizedFirstName} ${capitalizedLastName}`,
        },
      }
    );
    if (!clients || !client)
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client does not exist'
      );
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'client details updated successfully',
      {
        client: clients,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function removeClientImage(req, res, next) {
  try {
    const { clientId } = req.params;

    // Find the client by ID
    const client = await models.clientModel.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    client.clientImage = {
      path: '/cdn/images/user.png',
      uploadedDate: new Date(),
    };

    await client.save();

    return res
      .status(200)
      .json({ message: 'profile image is removed successfully' });
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function removeBrandLogoImage(req, res, next) {
  try {
    const { clientId, brandId, logoId } = req.params;

    const client = await models.clientModel.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    const brand = await models.clientBrandInfoModel.findById(brandId);
    brand.logos = brand.logos.filter((logo) => logo._id.toString() !== logoId);

    await brand.save();
    return res.status(200).json({ message: 'Logo is removed successfully' });
  } catch (error) {
    console.error(error);
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
        clientUserName: await capitalizeEachWordFirstLetter(clientUserName),
        clientUserEmail,
        password: await generatePasswordHash(passcode),
        roleId: role._id,
        isInvite: true,
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
      true,
      `invite email is sent to ${clientUserEmail}`
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updateClientBrief(req, res, next) {
  const { clientId } = req.params;

  try {
    const existingClient = await models.clientModel.findById(clientId);

    if (!existingClient) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found'
      );
    }

    existingClient.clientBrief.set(req.body);
    const updatedClient = await existingClient.save();

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Client updated',
      updatedClient
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function addClientBrief(req, res, next) {
  const {
    adGoals,
    toneOfVoice,
    productServiceName,
    targetAudience,
    briefDescription,
  } = req.body;
  const { clientId } = req.params;

  try {
    const existingClient = await models.clientModel.findById(clientId);

    if (!existingClient) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found'
      );
    }
    if (existingClient.clientBrief != null) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'Client brief already exist'
      );
    } else if (!existingClient.clientBrief) {
      existingClient.clientBrief = {};
    }

    const goal = await models.adGoalModel.findById(adGoals);
    const tone = await models.toneOfVoiceModel.findById(toneOfVoice);

    if (!goal) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'adGoal not found'
      );
    }

    if (!tone) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Tone of Voice not found'
      );
    }

    existingClient.clientBrief.adGoals = goal._id;
    existingClient.clientBrief.toneOfVoice = tone._id;
    existingClient.clientBrief.targetAudience = targetAudience;
    existingClient.clientBrief.productServiceName = productServiceName;
    existingClient.clientBrief.briefDescription = briefDescription;

    await existingClient.save();

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'Client brief added',
      existingClient
    );
  } catch (error) {
    return next(new Error(error));
  }
}

// export async function removeClientBrief(req, res, next) {
//   try {
//     const { clientId } = req.params;
//     const deletedClient = await models.clientModel.findOneAndUpdate(
//       { _id: clientId },
//       { $set: { clientBrief: null } },
//       { new: true }
//     );

//     if (!deletedClient) {
//       return responseHelper(
//         res,
//         httpStatus.NOT_FOUND,
//         true,
//         'Client or clientBriefDetails not found.'
//       );
//     }
//     return responseHelper(
//       res,
//       httpStatus.OK,
//       false,
//       'clientBriefDetails deleted.'
//     );
//   } catch (error) {
//     return next(new Error(error));
//   }
// }

export async function addSocialMedia(req, res, next) {
  const { clientId } = req.params;
  const socialMedia = req.body.clientSocialMedia || [];
  try {
    const updatedClient = await models.clientModel.findOneAndUpdate(
      { _id: clientId },
      {
        $push: {
          clientSocialMedia: socialMedia,
        },
      },
      { upsert: true, new: true }
    );

    if (!updatedClient) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found.'
      );
    }

    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      'New social media added',
      updatedClient
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function removeSocialMedia(req, res, next) {
  try {
    const { arrayId, clientId } = req.params;
    const deletedClient = await models.clientModel.findOneAndUpdate(
      { _id: clientId, 'clientSocialMedia._id': arrayId },
      { $pull: { clientSocialMedia: { _id: arrayId } } },
      { new: true }
    );
    if (!deletedClient) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client or social media item not found.'
      );
    }
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'social media item deleted.'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updateBrandKit(req, res, next) {
  const { clientId } = req.params;
  const {
    mainBrandColor,
    brandKitSubheadingCode,
    brandKitDescriptionColorCode,
    alternateColor,
    brandFont,
  } = req.body;

  const existingBrandKit = await models.clientModel.findOne(
    { _id: clientId },
    { 'brandKit.$': 1 }
  );
  if (!existingBrandKit) {
    await removeMulterFiles(req.files);
    return responseHelper(res, httpStatus.NOT_FOUND, true, 'Client not found.');
  }
  let logoToUpdate = null,
    brandPatternPath;
  if (req.files) {
    let { brandKitLogo, brandPattern } = req.files;
    logoToUpdate =
      brandKitLogo && brandKitLogo[0]
        ? {
            name: brandKitLogo[0].originalname,
            fileName: brandKitLogo[0].filename,
            path: '/cdn/uploads/images/' + brandKitLogo[0].filename,
            uploadedDate: new Date(),
          }
        : null;
    if (!logoToUpdate) {
      logoToUpdate = existingBrandKit.brandKit.logo;
    }
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

    brandPatternPath = extractBrandPatternPaths(brandPattern);
    if (!brandPatternPath) {
      brandPatternPath = existingBrandKit.brandKit.brandPattern;
    }
  }
  let brandFontArrayProvided = brandFont
    ? brandFont.split(',').map((font) => font.trim())
    : [];

  let brandFontToUpdate =
    brandFontArrayProvided.length > 0
      ? brandFontArrayProvided
      : existingBrandKit.brandKit.brandFont;

  try {
    const updatedClient = await models.clientModel.findOneAndUpdate(
      { _id: clientId },
      {
        $set: {
          'brandKit.logo': logoToUpdate,
          'brandKit.mainBrandColor': mainBrandColor,
          'brandKit.brandKitDescriptionColorCode': brandKitDescriptionColorCode,
          'brandKit.alternativeColorCode': alternateColor,
          'brandKit.brandKitSubheadingCode': brandKitSubheadingCode,
          'brandKit.brandFont': brandFontToUpdate,
          'brandKit.brandPattern': brandPatternPath,
        },
      },
      { new: true }
    );

    if (!updatedClient) {
      await removeMulterFiles(req.files);
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client or brand kit item not found.'
      );
    }
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Brand kit updated',
      updatedClient
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function addBrandKit(req, res, next) {
  const { clientId } = req.params;
  const {
    mainBrandColor,
    brandKitSubheadingCode,
    brandKitDescriptionColorCode,
    alternateColor,
    brandFont,
  } = req.body;
  let { brandKitLogo, brandPattern } = req.files;
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
  const client = await models.clientModel.findById({ _id: clientId });
  if (!client) {
    await removeMulterFiles(req.files);
    return responseHelper(res, httpStatus.NOT_FOUND, true, 'Client not found.');
  }
  if (client.brandKit)
    responseHelper(
      res,
      httpStatus.CONFLICT,
      true,
      'Brand kit already exist',
      {}
    );
  try {
    if (!client.brandKit) {
      client.brandKit = {};
    }

    (client.brandKit.logo =
      brandKitLogo && brandKitLogo[0]
        ? {
            name: brandKitLogo[0].originalname,
            fileName: brandKitLogo[0].filename,
            path: '/cdn/uploads/images/' + brandKitLogo[0].filename,
            uploadedDate: new Date(),
          }
        : null),
      (client.brandKit.mainBrandColor = mainBrandColor),
      (client.brandKit.alternativeColorCode = alternateColor),
      (client.brandKit.brandKitDescriptionColorCode =
        brandKitDescriptionColorCode),
      (client.brandKit.brandKitSubheadingCode = brandKitSubheadingCode),
      (client.brandKit.brandFont = brandFont
        ? brandFont.split(',').map((font) => font.trim())
        : []),
      (client.brandKit.brandPattern = brandPatternPath),
      await client.save();

    return responseHelper(res, httpStatus.CREATED, false, 'Brand kit added', {
      client: client,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

// export async function removeBrandKit(req, res, next) {
//   try {
//     const { clientId } = req.params;
//     const client = await models.clientModel.findById(clientId);

//     if (!client) {
//       return responseHelper(
//         res,
//         httpStatus.NOT_FOUND,
//         true,
//         'Client not found.'
//       );
//     }

//     if (!client.brandKit) {
//       return responseHelper(
//         res,
//         httpStatus.NOT_FOUND,
//         true,
//         'Brand kit not found.'
//       );
//     }

//     await models.clientModel.findOneAndUpdate(
//       { _id: clientId },
//       { $set: { brandKit: null } },
//       { new: true }
//     );

//     return responseHelper(res, httpStatus.OK, false, 'Brand kit item deleted.');
//   } catch (error) {
//     return next(new Error(error));
//   }
// }

export async function removeBrandKitPattern(req, res, next) {
  try {
    const { patternId, clientId } = req.params;

    const updatedClient = await models.clientModel.findOneAndUpdate(
      { _id: clientId },
      { $pull: { 'brandKit.brandPattern': { _id: patternId } } },
      { new: true }
    );

    if (!updatedClient) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client or Brand Pattern not found.'
      );
    }

    const patternIndex = updatedClient.brandKit.brandPattern.findIndex(
      (pattern) => pattern._id.equals(patternId)
    );

    if (patternIndex === -1) {
      return responseHelper(
        res,
        httpStatus.OK,
        false,
        'Brand pattern deleted successfully.',
        {}
      );
    } else {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Brand Pattern not found.'
      );
    }
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function removeTemplate(req, res, next) {
  try {
    const { templateId, clientId, index } = req.params;
    const client = await models.clientModel.findById(clientId);

    if (!client) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found.'
      );
    }
    // Remove array of objects at the specified index
    //client.template.splice(index, 1);

    // Save the updated client
    // await client.save();
    const updatedClient = await models.clientModel.findOneAndUpdate(
      { _id: clientId, 'templates._id': templateId },
      { $pull: { templates: { _id: templateId } } },
      { new: true }
    );

    if (!updatedClient) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Template not found.'
      );
    }

    const templateObjectId = new Types.ObjectId(templateId);

    const templateIndex = updatedClient.templates.findIndex((template) =>
      template._id.equals(templateObjectId)
    );

    if (templateIndex === -1) {
      return responseHelper(
        res,
        httpStatus.OK,
        false,
        'Template deleted successfully.',
        updatedClient
      );
    } else {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Template not found.'
      );
    }
  } catch (error) {
    console.error(error);
    return next(new Error(error));
  }
}

export async function removeAllTemplate(req, res, next) {
  try {
    const { clientId } = req.params;
    const client = await models.clientModel.findById(clientId);

    if (!client) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found.'
      );
    }

    if (client.templates && client.templates.length > 0) {
      client.templates = [];

      await client.save();

      return responseHelper(res, httpStatus.OK, false, 'Templates deleted.');
    } else {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Templates array is already empty'
      );
    }
  } catch (error) {
    return next(new Error(error));
  }
}

export async function addTemplate(req, res, next) {
  const { clientId } = req.params;
  const { template } = req.files;
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
  try {
    const updatedClient = await models.clientModel.findOneAndUpdate(
      { _id: clientId },
      {
        $push: {
          templates: { $each: templatePaths },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      await removeMulterFiles(req.files);
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found.'
      );
    }
    return responseHelper(
      res,
      httpStatus.CREATED,
      false,
      ' New template(s) added'
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function updateImage(req, res, next) {
  try {
    // Only for updates client Image
    let Id = await models.clientModel.findById(req.params.clientId);
    if (!Id) {
      await removeMulterFiles(req.files);
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client not found.'
      );
    }
    const { clientImage } = req.files;
    if (req.files && req.files.clientImage) {
      const clientPic = {
        name: clientImage[0].originalname,
        fileName: clientImage[0].filename,
        path: '/cdn/uploads/images/' + clientImage[0].filename,
        uploadedDate: new Date(),
      };
      Id.clientImage = clientPic;
      await Id.save();
      return responseHelper(res, httpStatus.OK, false, 'Client Image Updated');
    }

    // For updates Logo1 / Logo2 or both
    if (req.files && (req.files.logoImage || req.files.waterMarkImage)) {
      const { logoImage, waterMarkImage } = req.files;
      const imageData = {};

      const getImageData = (file, key) => {
        const filePath =
          file && file[0]
            ? {
                name: file[0].originalname,
                fileName: file[0].filename,
                path: '/cdn/uploads/images/' + file[0].filename,
                uploadedDate: new Date(),
              }
            : null;
        imageData[key] = filePath;
      };

      if (logoImage) getImageData(logoImage, 'logoImage');
      if (waterMarkImage) getImageData(waterMarkImage, 'waterMarkImage');

      if (logoImage && waterMarkImage) {
        const logo = {
          name: logoImage[0].originalname,
          fileName: logoImage[0].filename,
          path: '/cdn/uploads/images/' + logoImage[0].filename,
          uploadedDate: new Date(),
        };
        const logo2 = {
          name: waterMarkImage[0].originalname,
          fileName: waterMarkImage[0].filename,
          path: '/cdn/uploads/images/' + waterMarkImage[0].filename,
          uploadedDate: new Date(),
        };
        imageData.logoImage = logo;
        imageData.waterMarkImage = logo2;
      }

      const clientId = req.params.clientId;

      let client = await models.clientModel.findByIdAndUpdate(
        clientId,
        { $set: { ...imageData } },
        { new: true }
      );

      if (!client) {
        await removeMulterFiles(req.files);
        return responseHelper(
          res,
          httpStatus.NOT_FOUND,
          true,
          'Client not found.'
        );
      }
      return responseHelper(res, httpStatus.OK, false, 'Logo Updated');
    }
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
      `system access has been ${
        systemAccess ? 'enabled' : 'disabled'
      } successfully`,
      { user: updatedClient }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

export async function destroy(req, res, next) {
  try {
    const { clientId } = req.params;
    const client = await models.clientModel.findByIdAndDelete(clientId);
    if (!client) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Client does not exist'
      );
    }
    return responseHelper(res, httpStatus.OK, false, 'Client deleted');
  } catch (error) {
    return next(new Error(error));
  }
}

export async function removeBrand(req, res, next) {
  try {
    const { clientId, brandId } = req.params;
    const client = await models.clientModel.findById(clientId);
    if (!client) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'client does not exist'
      );
    }
    const clientBrand =
      await models.clientBrandInfoModel.findByIdAndDelete(brandId);
    if (!clientBrand) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Brand does not exist'
      );
    }
    return responseHelper(res, httpStatus.OK, false, 'Brand deleted');
  } catch (error) {
    return next(new Error(error));
  }
}
