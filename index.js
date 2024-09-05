const core = require("@actions/core");
const github = require("@actions/github");
const Anthropic = require("@anthropic-ai/sdk");

async function app() {
  try {
    const token = core.getInput("github-token");
    const apiKey = core.getInput("api-key");
    const octokit = github.getOctokit(token);
    const { context } = github;
    const pullRequestNumber = context.payload.pull_request.number;
    const repo = context.repo.repo;
    const owner = context.repo.owner;

    // 변경된 파일 목록 가져오기
    const files = await getChangedFiles(
      octokit,
      owner,
      repo,
      pullRequestNumber
    );

    // 앤트로픽 API 인스턴스 생성
    const anthropic = createAnthropicInstance(apiKey);

    // 파일을 순차적으로 리뷰
    for (const file of files) {
      await reviewFile(
        anthropic,
        octokit,
        owner,
        repo,
        pullRequestNumber,
        file
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

// 변경된 파일 목록을 가져오는 함수
async function getChangedFiles(octokit, owner, repo, pullRequestNumber) {
  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullRequestNumber,
  });
  return files;
}

// 앤트로픽 API 인스턴스를 생성하는 함수
function createAnthropicInstance(apiKey) {
  return new Anthropic({
    apiKey: apiKey, // 또는 실제 API 키 입력
  });
}

// 파일을 리뷰하는 함수
async function reviewFile(
  anthropic,
  octokit,
  owner,
  repo,
  pullRequestNumber,
  file
) {
  core.info(`Reviewing file: ${file.filename}`);

  const reviewMessage = await getReviewMessage(anthropic, file);

  await postReviewComment(
    octokit,
    owner,
    repo,
    pullRequestNumber,
    file,
    reviewMessage
  );
}

// 리뷰 메시지를 생성하는 함수
async function getReviewMessage(anthropic, file) {
  // const message = await anthropic.messages.create({
  //   model: "claude-3-5-sonnet-20240620", // 사용할 클로드 모델
  //   max_tokens: 500, // 응답의 최대 토큰 수
  //   temperature: 0, // 응답의 무작위성
  //   system: `review: ${file.filename}`, // 시스템 메시지 설정
  //   messages: [
  //     {
  //       role: "user",
  //       content: `Please review the following file and provide suggestions for improvement. Advice should be no more than 5 lines and 100 characters. \n\nFile Name:Please review the following file and provide suggestions for improvement.\n\nFile Name:  ${file.filename}\n\nFile Content:\n\n${file.content}`,
  //     },
  //   ],
  // });
  // return JSON.stringify(message.content[0].text);

  return "hihihihihi";
}

// 리뷰 코멘트를 PR에 게시하는 함수
async function postReviewComment(
  octokit,
  owner,
  repo,
  pullRequestNumber,
  file,
  reviewMessage
) {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullRequestNumber,
    body: `
      Code Review Completed

      \`\`\`${file.language || "plaintext"}
      ${file.content}
      \`\`\`
      
      Review Feedback
      
      ${reviewMessage}
    `,
  });
}

app();
