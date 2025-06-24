import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generatePersonaAndIntent(data: {
  targetKeyword: string;
  industry: string;
  contentType: string;
  additionalContext?: string;
  competitorData: string[];
}): Promise<{
  targetAudience: string;
  searchIntent: string;
  contentGoals: string[];
  toneSuggestions: string;
  keyTopics: string[];
}> {
  const prompt = `
Based on the following information, analyze the target audience and search intent:

Target Keyword: ${data.targetKeyword}
Industry: ${data.industry}
Content Type: ${data.contentType}
Additional Context: ${data.additionalContext || "None"}

Competitor Analysis:
${data.competitorData.join('\n')}

Please provide a detailed persona and intent analysis in JSON format with these fields:
- targetAudience: Description of the ideal reader
- searchIntent: What the user is trying to accomplish
- contentGoals: Array of 3-5 main goals for the content
- toneSuggestions: Recommended tone and writing style
- keyTopics: Array of 5-8 key topics to cover

Respond in JSON format only.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO content strategist. Analyze search intent and target audiences based on competitor research."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate persona and intent analysis: " + (error as Error).message);
  }
}

export async function generateContentOutline(data: {
  targetKeyword: string;
  personaAnalysis: any;
  competitorData: string[];
}): Promise<{
  title: string;
  introduction: string;
  sections: Array<{
    heading: string;
    subheadings: string[];
    keyPoints: string[];
  }>;
  conclusion: string;
  estimatedWordCount: number;
}> {
  const prompt = `
Create a comprehensive content outline for an article about "${data.targetKeyword}".

Target Audience: ${data.personaAnalysis.targetAudience}
Search Intent: ${data.personaAnalysis.searchIntent}
Key Topics to Cover: ${data.personaAnalysis.keyTopics?.join(', ')}

Competitor Analysis:
${data.competitorData.join('\n')}

Create a detailed outline in JSON format with:
- title: SEO-optimized title
- introduction: Brief intro description
- sections: Array of main sections with heading, subheadings, and keyPoints
- conclusion: Description of conclusion approach
- estimatedWordCount: Total estimated word count

Respond in JSON format only.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO content writer. Create detailed content outlines that rank well in search engines."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate content outline: " + (error as Error).message);
  }
}

export async function generateSectionContent(data: {
  section: any;
  targetKeyword: string;
  personaAnalysis: any;
  outline: any;
}): Promise<string> {
  const prompt = `
Write detailed content for this section of an article about "${data.targetKeyword}":

Section: ${data.section.heading}
Subheadings: ${data.section.subheadings?.join(', ')}
Key Points: ${data.section.keyPoints?.join(', ')}

Target Audience: ${data.personaAnalysis.targetAudience}
Tone: ${data.personaAnalysis.toneSuggestions}

Write comprehensive, SEO-optimized content that:
- Uses the target keyword naturally
- Provides valuable, actionable information
- Maintains the recommended tone
- Is well-structured with proper headings
- Includes relevant examples where appropriate

Write the content in markdown format.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO content writer. Write high-quality, engaging content that ranks well and provides value to readers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error("Failed to generate section content: " + (error as Error).message);
  }
}

export async function generateMetaTags(data: {
  title: string;
  content: string;
  targetKeyword: string;
}): Promise<{
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string[];
  socialTitle: string;
  socialDescription: string;
}> {
  const prompt = `
Generate SEO meta tags for this article:

Title: ${data.title}
Target Keyword: ${data.targetKeyword}
Content Preview: ${data.content.substring(0, 500)}...

Create optimized meta tags in JSON format with:
- metaTitle: SEO title (50-60 characters)
- metaDescription: Meta description (150-160 characters)
- focusKeywords: Array of 3-5 focus keywords
- socialTitle: Social media title (60 characters max)
- socialDescription: Social media description (120 characters max)

Respond in JSON format only.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert. Create compelling meta tags that improve click-through rates and search rankings."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate meta tags: " + (error as Error).message);
  }
}
