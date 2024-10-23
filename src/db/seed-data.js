const seedData = {
  adGoals: [
    {
      adGoal: 'Get Leads',
    },
    {
      adGoal: 'Get Sales',
    },
    {
      adGoal: 'Get Messages',
    },
    {
      adGoal: 'Get Calls',
    },
    {
      adGoal: 'Get Store Visits',
    },
    {
      adGoal: 'Get Brand Awareness',
    },
  ],
  roles: [
    {
      roleName: 'client user',
      isActive: true,
    },
    {
      roleName: 'client',
      isActive: true,
    },
    {
      roleName: 'project management',
      isActive: true,
    },
    {
      roleName: 'admin',
      isActive: true,
    },
    {
      roleName: 'development',
      isActive: true,
    },
    {
      roleName: 'testing',
      isActive: true,
    },
    {
      roleName: 'designing',
      isActive: true,
    },
    {
      roleName: 'marketing',
      isActive: true,
    },
    {
      roleName: 'analysis',
      isActive: false,
    },
    {
      roleName: 'animation',
      isActive: false,
    },
  ],
  defaultPermissions: [
    {
      name: 'client-dashboard',
      accessToAllControls: false,
      controls: [
        {
          name: 'view-dashboard',
          active: false,
        },
        {
          name: 'view-projects',
          active: false,
        },
        {
          name: 'view-project-overview',
          active: false,
        },
        {
          name: 'view-project-document-management',
          active: false,
        },
        {
          name: 'view-user-management',
          active: false,
        },
        {
          name: 'add-client-user',
          active: false,
        },
        {
          name: 'delete-client-user',
          active: false,
        },
        {
          name: 'make-client-coordinator',
          active: false,
        },
        {
          name: 'view-discussion-forum',
          active: false,
        },
        {
          name: 'create-discussion',
          active: false,
        },
        {
          name: 'delete-discussion',
          active: false,
        },
        {
          name: 'update-discussion',
          active: false,
        },
        {
          name: 'view-social-media-post',
          active: false,
        },
        {
          name: 'bulk-action',
          active: false,
        },
        {
          name: 'view-individual-post',
          active: false,
        },
        {
          name: 'reject-post',
          active: false,
        },
        {
          name: 'approve-post',
          active: false,
        },
        {
          name: 'rework-post',
          active: false,
        },
        {
          name: 'add-comments',
          active: false,
        },
        {
          name: 'delete-comments',
          active: false,
        },
      ],
    },
    {
      name: 'project-manager-dashboard',
      accessToAllControls: false,
    },
    {
      name: 'users',
      accessToAllControls: true,
      controls: [
        {
          name: 'create',
          active: false,
        },
        {
          name: 'update',
          active: false,
        },
        {
          name: 'view',
          active: true,
        },
        {
          name: 'delete',
          active: false,
        },
      ],
    },
    {
      name: 'clients',
      accessToAllControls: true,
      controls: [
        {
          name: 'create',
          active: false,
        },
        {
          name: 'update',
          active: false,
        },
        {
          name: 'view',
          active: true,
        },
        {
          name: 'delete',
          active: false,
        },
      ],
    },
    {
      name: 'projects',
      accessToAllControls: true,
      controls: [
        {
          name: 'create',
          active: false,
        },
        {
          name: 'update',
          active: false,
        },
        {
          name: 'view',
          active: true,
        },
        {
          name: 'delete',
          active: false,
        },
        {
          name: 'update-status',
          active: false,
        },
        {
          name: 'view-project',
          active: true,
        },
        {
          name: 'update-project-overview',
          active: false,
        },
        {
          name: 'rename-document',
          active: false,
        },
        {
          name: 'delete-document',
          active: false,
        },
        {
          name: 'save-document',
          active: true,
        },
        {
          name: 'add-client-user',
          active: false,
        },
        {
          name: 'remove-client-user',
          active: false,
        },
        {
          name: 'make-client-coordinator',
          active: false,
        },
        {
          name: 'add-project-coordinator',
          active: false,
        },
        {
          name: 'remove-project-coordinator',
          active: false,
        },
        {
          name: 'make-project-manager',
          active: false,
        },
        {
          name: 'view-tasks',
          active: true,
        },
        {
          name: 'create-tasks',
          active: false,
        },
        {
          name: 'update-task',
          active: false,
        },
        {
          name: 'delete-task',
          active: false,
        },
        {
          name: 'update-task-status',
          active: true,
        },
        {
          name: 'task-submit-for-approval',
          active: true,
        },
        {
          name: 'task-bulk-actions',
          active: false,
        },
        {
          name: 'view-discussion-forum',
          active: true,
        },
        {
          name: 'send-discussion-forum-message',
          active: true,
        },
        {
          name: 'edit-discussion-forum-message',
          active: true,
        },
        {
          name: 'delete-discussion-forum-message',
          active: true,
        },
        {
          name: 'generate-social-media-planner',
          active: false,
        },
      ],
    },
    {
      name: 'settings',
      accessToAllControls: false,
      controls: [
        {
          name: 'create-role',
          active: false,
        },
        {
          name: 'view-role',
          active: false,
        },
        {
          name: 'update-role',
          active: false,
        },
        {
          name: 'delete-role',
          active: false,
        },
        {
          name: 'create-designation',
          active: false,
        },
        {
          name: 'view-designation',
          active: false,
        },
        {
          name: 'update-designation',
          active: false,
        },
        {
          name: 'delete-designation',
          active: false,
        },
        {
          name: 'create-ad-goal',
          active: false,
        },
        {
          name: 'view-ad-goal',
          active: false,
        },
        {
          name: 'update-ad-goal',
          active: false,
        },
        {
          name: 'delete-ad-goal',
          active: false,
        },
        {
          name: 'create-tone-of-voice',
          active: false,
        },
        {
          name: 'view-tone-of-voice',
          active: false,
        },
        {
          name: 'update-tone-of-voice',
          active: false,
        },
        {
          name: 'delete-tone-of-voice',
          active: false,
        },
      ],
    },
    {
      name: 'tools',
      accessToAllControls: false,
      controls: [
        {
          name: 'generate-email-draft',
          active: false,
        },
        {
          name: 'view-email-draft',
          active: false,
        },
        {
          name: 'save-email-draft',
          active: false,
        },
        {
          name: 'generate-campaign-idea',
          active: false,
        },
        {
          name: 'view-campaign-idea',
          active: false,
        },
        {
          name: 'save-campaign-idea',
          active: false,
        },
        {
          name: 'generate-creative-idea',
          active: false,
        },
        {
          name: 'view-creative-idea',
          active: false,
        },
        {
          name: 'save-creative-idea',
          active: false,
        },
        {
          name: 'generate-single-post',
          active: false,
        },
      ],
    },
  ],
  designations: [
    {
      designation: 'node.js developer',
      isActive: true,
    },
    {
      designation: 'digital marketing executive',
      isActive: true,
    },
    {
      designation: 'react.js developer',
      isActive: true,
    },
    {
      designation: 'project manager',
      isActive: true,
    },
    {
      designation: 'graphics designer',
      isActive: true,
    },
    {
      designation: 'quality tester',
      isActive: false,
    },
    {
      designation: 'content writer',
      isActive: false,
    },
    {
      designation: 'video macker',
      isActive: false,
    },
    {
      designation: '3D animator',
      isActive: false,
    },
    {
      designation: 'admin',
      isActive: true,
    },
  ],
  toneOfVoices: [
    {
      toneOfVoice: 'Professional',
    },
    {
      toneOfVoice: 'Informal',
    },
    {
      toneOfVoice: 'Friendly',
    },
    {
      toneOfVoice: 'Enthusiastic',
    },
    {
      toneOfVoice: 'Humorous',
    },
    {
      toneOfVoice: 'Inspirational',
    },
    {
      toneOfVoice: 'Persuasive',
    },
    {
      toneOfVoice: 'Luxurious',
    },
    {
      toneOfVoice: 'Conversational',
    },
    {
      toneOfVoice: 'Educational',
    },
    {
      toneOfVoice: 'Emotional',
    },
    {
      toneOfVoice: 'Authoritative',
    },
    {
      toneOfVoice: 'Nostalgic',
    },
    {
      toneOfVoice: 'Romantic',
    },
    {
      toneOfVoice: 'Playful',
    },
    {
      toneOfVoice: 'Sarcastic',
    },
    {
      toneOfVoice: 'Urgent',
    },
    {
      toneOfVoice: 'Empathetic',
    },
    {
      toneOfVoice: 'Uplifting',
    },
    {
      toneOfVoice: 'Minimalist',
    },
  ],
  prompts: [
    {
      name: 'content ideas',
      information:
        'please answer me as expert of social media content idea generator , your task to generate social media ideas by considering following information',
      params: `projectBrief:
        Ad Goals: [adGoals]
        Tone of Voice: [toneOfVoice]
        Target Audience : [targetAudience]
        Product Or Service: [productOrService]
        Description: [description]
        Use [language] for title and content`,
      instruction: `instructions: generate 5 ideas.content must be one or two lines only , output must be in json  array format like [{"title":"","content":""}].`,
    },

    {
      name: 'generate more content ideas',
      information:
        'please answer me as expert of social media content idea generator , your task to generate  more social media ideas by considering following information',
      params: ` projectBrief:

      Ad Goals: [adGoals]
      Tone of Voice: [toneOfVoice]
      Target Audience : [targetAudience]
      Product Or Service: [productOrService]
      Description: [description]


      Use [language] for title and content

      selectedIdeas:
       [selectedIdeas]`,
      instruction: `instructions: generate 5 item must have title and content and in json array of format [{title:"",content:""},...] . do not consider information which is undefined`,
    },
    {
      name: 'content idea regenerate',
      information:
        'please answer me as expert of social media content idea generator , your task to regenerate following  social media content by considering following information.',
      params:
        'clientBrief: [clientBrief] /n' +
        'Ad Goals: [adGoals] /n' +
        'Tone of Voice: [toneOfVoice] /n' +
        'Target: [targetAudience] /n' +
        'Product: [productServiceName] /n' +
        'Description: [description] /n' +
        'Social Media Content:  /n/n' +
        'title: [title] /n' +
        'content: [content] /n',
      instruction:
        'Regenerate content of this use exact same title, generate in json format {title:"",content:""}',
    },
    {
      name: 'tool email',
      information:
        'please answer me as expert of social media content idea generator , your task to generate email draft by considering following information :',
      params: `Details:
            Language: [language]
            Mail subject: [subject]
            Tone of Voice: [toneOfVoice]
            Target: [targetAudience]
           Key points: [keyPoints]
          `,
      instruction: `Please generate email template using above detail.please consider the language.do not consider information which is undefined`,
    },
    {
      name: 'tool campaign idea',
      information:
        'please answer me as expert of social media content idea generator , your task to generate campaign idea by considering following information :',
      params: `Details:
          Project Name: [project]
          Language: [language]
          Prompt: [prompt]
          Tone of Voice: [toneOfVoice]
          Target: [targetAudience]
          hashTag: [hashTag]
          Approximate Words: [approximateWords]
          Platform: [platform]
          `,
      instruction: `Please generate  campaign idea with a heading and bullet numbered contents.generate output in given language.generate content with limited words.do not consider information which is undefined.
            `,
    },
    {
      name: 'tool creative idea',
      information:
        'please answer me as expert of social media content idea generator , your task to generate creative idea by considering following information :',
      params: `Details:
          Project Name: [project]
          Language: [language]
          Prompt: [prompt]
          Tone of Voice: [toneOfVoice]
          Target: [targetAudience]
          hashTag: [hashTag]
          Approximate Words: [approximateWords]
          Platform: [platform]
          `,
      instruction:
        'Please generate creative idea with a heading and bullet numbered contents.generate output in given language.do not consider information which is undefined.',
    },
    {
      name: `post ideas and dalle prompt generator`,
      information:
        'please answer me as expert of graphical designer , your task to generate imageIdeas and a detailed dallePrompt for generating image considering following post ideas :',
      params: '/n/nPost ideas :/n [postIdeas] /n/n use [language] as language',
      instruction: `Please generate  in json of format : { imageIdeas:[],dallePrompt:"" }.`,
    },
    {
      name: 'regenerate single post',
      information:
        'please answer me as expert of social media content writer , your task to regenerate post by considering following post:',
      params: `Regenerate [SocialMediaPlatform] post
               Post : [post]
               generate in following json format: {platform:"[platform]",post:""}`,
      instruction: `Regenerate the post`,
    },
    {
      name: 'generate posts',
      information:
        'Please answer me as expert of social media content writer, your task to generate social media post for selected platform by considering following content ideas ,information and given plan :',
      params: `/n/nInformation :
      Project Brief:
      Ad Goals : [adGoals]
      Tone of Voice : [toneOfVoice]
      Target : [targetAudience]
      Product : [productServiceName]
      Description : [briefDescription]
      Content Ideas
      [contentIdeas]
      Plan:
      [plan]
      Settings: [settings]`,
      instruction: `Generate posts only for selected social media platforms and each post must be different content.The format should be a JSON array, structured as [{platform:"facebook", post:""}, ...].`,
    },
    {
      name: 'generate single post',
      information:
        'Please answer me as expert of social media content writer, your task to generate social media post for selected platform by considering following information :',
      params: `/n/nInformation :
      Client Brief: [clientBrief]
      projectBrief:[projectBrief]

      title:[title]
      content:[content]
      Use [language] as language: Generate a post for [platform] , in the format of json {platform:"[platform]",post:""}]`,
      instruction: `add emojis and hashtags if needed.`,
    },
    {
      name: 'image ideas and dalle prompt generator',
      information:
        'please answer me as expert of graphical designer , your task to regenerate 10 imageIdeas and a detailed dallePrompt which will be use to generate image. considering following post ideas:',
      params: `post ideas :\n.[postIdeasString] `,
      instruction: `Please generate  in json of format : { imageIdeas:["","",...],dallePrompt:"" }.`,
    },
    {
      name: 'image ideas regenerate',
      information:
        'please answer me as expert of graphical designer , your task to regenerate imageIdeas considering old image ideas\n\n',
      params: `imageIdeas: [imageIdeas]
              Use [language] as response language.`,
      instruction: `Do not repeat old image ideas. response should be in json format {imageIdeas:["",...]} .`,
    },
    {
      name: 'dalle prompt regenerate',
      information:
        'please answer me as expert of graphical designer , your task to regenerate following dallePrompt which is used in dalle to generate image, considering old dallePrompt :',
      params: `dallePrompt: [dallePrompt]\n
              Use [language] as response language.\n`,
      instruction: `Do not repeat the old dalle prompt. response should be in json format {dallePrompt:""} `,
    },
    {
      name: 'generate tag ideas',
      information:
        'please answer me as expert of social media content generator generate tagIdeas, based on following information.',
      params: `productServiceName:"[productServiceName]"
      description:"[description]"`,
      instruction: '/nThe response should be in json format {tagIdeas:[]}',
    },
  ],
};

export { seedData };
