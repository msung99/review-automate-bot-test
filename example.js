const Anthropic = require("@anthropic-ai/sdk");
const run = async () => {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
  });

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620", // 사용할 클로드 모델
    max_tokens: 500, // 응답의 최대 토큰 수
    temperature: 0, // 응답의 무작위성
    system: "Please review the following code file and provide feedback.", // 시스템 메시지 설정
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please review the following file and provide suggestions for improvement.\n\nFile Name: test\n\nFile Content:\n\n int main(void)`,
          },
        ],
      },
    ],
  });
  //   console.log(msg.content.text);
  const result = JSON.stringify(msg.content[0].text);
  console.log(result);
};

run();
