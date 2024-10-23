export function emailContentRegeneratePrompt(key = '', subject, toneOfVoice) {
  if (key !== 'tool_email')
    throw new Error('invalid prompt key provided (tool_email)');
  if (!toneOfVoice) {
    throw new Error('toneOfVoice is required');
  }
  return `Strictly follow the <html> format to generate an email draft and annotations of the draft with ${subject} if applicable but keep the <html> format.

       <p> [Your Name]</p>
       <p> [Your Address]</p> 
       <p> [City, State, Zip Code]</p>
       <p> [Your Email Address]</p>
       <p> [Date]</p> 

       <p> [Recipient's Name]</p> 
       <p> [Recipient's Title (if applicable)]</p>
       <p> [Company Name (if applicable)]</p> 
       <p> [Recipient's Address]</p> 
       <p> [City, State, Zip Code]</p>

       <p>  Dear [Recipient's Name],</p> 

       <p>  [Body of the Letter - Include your message or purpose for writing the letter here. Use clear and concise language, and organize your content into paragraphs as needed.] the diffenent content should be placed in differnet paragraph</p>

       <p>  [Closing Remark],</p>


       <p> [Your Typed Name]</p> 
       <p> [Your Title (if applicable)]</p> 
       <p>  [Your Company Name (if applicable)]</p>

       <p>  Enclosures: [List of Enclosures or Attachments, if any]</p> `;
}
