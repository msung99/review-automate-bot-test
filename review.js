const core = require("@actions/core");
const axios = require("axios");
const Anthropic = require("anthropic-ai/sdk");

// 클라우드 API를 사용하여 파일을 리뷰하는 함수
async function reviewFileWithCloudAPI(file) {
  try {
    // defaults to process.env["ANTHROPIC_API_KEY"]);
    const anthropic = new Anthropic();

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620", // 사용할 클로드 모델
      max_tokens: 1000, // 응답의 최대 토큰 수
      temperature: 0, // 응답의 무작위성
      system: "Please review the following code file and provide feedback.", // 시스템 메시지 설정
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please review the following file and provide suggestions for improvement.\n\nFile Name: ${file.filename}\n\nFile Content:\n\n${file.content}`,
            },
          ],
        },
      ],
    });

    return msg;
  } catch (error) {
    core.error(`Failed to review file: ${file.filename}`);
    core.error(error.message);
    return null;
  }
}

module.exports = { reviewFileWithCloudAPI };
