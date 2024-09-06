const core = require("@actions/core");
const github = require("@actions/github");
const Anthropic = require("@anthropic-ai/sdk");

async function app() {
  try {
    core.info("Starting app function"); // 디버깅 구문

    const token = core.getInput("github-token") || process.env.GITHUB_TOKEN;
    core.info(`GitHub token retrieved: ${token ? "Yes" : "No"}`); // 디버깅 구문

    // 앤트로픽 API 키 가져오기
    const apiKey = core.getInput("api-key") || process.env.ANTHROPIC_API_KEY;
    core.info(`Anthropic API key retrieved: ${apiKey ? "Yes" : "No"}`); // 디버깅 구문

    // GitHub API 인스턴스 생성
    const octokit = github.getOctokit(token);
    const { context } = github;
    core.info(`Context received`); // 디버깅 구문

    // PR 번호 가져오기
    const pullRequestNumber = context.payload.pull_request.number;
    core.info(`Pull Request number: ${pullRequestNumber}`);

    // 레포지토리 정보 가져오기
    const repo = context.repo.repo;
    const owner = context.repo.owner;
    core.info(`Repository: ${owner}/${repo}`);

    // 변경된 파일 목록 가져오기
    const files = await getChangedFiles(octokit, owner, repo, pullRequestNumber);
    core.info(`Changed files: ${files.length} files found`); // 디버깅 구문

    // 앤트로픽 API 인스턴스 생성
    const anthropic = createAnthropicInstance(apiKey);
    core.info("Anthropic instance created"); // 디버깅 구문

    // 파일을 순차적으로 리뷰
    for (const file of files) {
      await reviewFile(anthropic, octokit, owner, repo, pullRequestNumber, file);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

// 파일의 실제 콘텐츠를 가져오는 함수
async function getFileContent(octokit, owner, repo, filePath) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: github.context.payload.pull_request.head.ref,
    });
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (error) {
    console.error(`Error fetching file content for ${filePath}: ${error.message}`);
    throw error;
  }
}

// 변경된 파일 목록을 가져오는 함수
async function getChangedFiles(octokit, owner, repo, pullRequestNumber) {
  core.info(`Fetching changed files for PR #${pullRequestNumber}`); // 디버깅 구문
  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullRequestNumber,
  });
  core.info(`Files fetched: ${files.length} files`); // 디버깅 구문
  core.info(`Files: ${JSON.stringify(files)}`); // 디버깅 구문
  return files;
}

// 앤트로픽 API 인스턴스를 생성하는 함수
function createAnthropicInstance(apiKey) {
  core.info("Creating Anthropic instance with provided API key"); // 디버깅 구문
  return new Anthropic({
    apiKey: apiKey, // 또는 실제 API 키 입력
  });
}

// 파일을 리뷰하는 함수
async function reviewFile(anthropic, octokit, owner, repo, pullRequestNumber, file) {
  core.info(`Reviewing file: ${file.filename}`);

  // 파일 정보 불러오기
  const fileContent = await getFileContent(octokit, owner, repo, file.filename);
  core.info(`file content: ${fileContent}`);

  // 리뷰를 요청
  const reviewMessage = await getReviewMessage(anthropic, file.filename, fileContent);
  core.info(`Review message received for ${file.filename}`);

  // 리뷰 코멘트를 PR에 게시
  await postReviewComment(octokit, owner, repo, pullRequestNumber, file, reviewMessage);
  core.info(`Review comment posted for ${file.filename}`);
}

// 리뷰 메시지를 생성하는 함수
async function getReviewMessage(anthropic, filename, fileContent) {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620", // 사용할 클로드 모델
    max_tokens: 500, // 응답의 최대 토큰 수
    temperature: 0, // 응답의 무작위성
    system: `review: ${filename}`, // 시스템 메시지 설정
    messages: [
      {
        role: "user",
        content: `Please review the following file and provide suggestions for improvement. Advice should be no more than 5 lines and 100 characters. \n\nFile Name:Please review the following file and provide suggestions for improvement.\n\nFile Name:  ${filename}\n\nFile Content:\n\n${fileContent}`,
      },
    ],
  });
  return JSON.stringify(message.content[0].text);
}

// 리뷰 코멘트를 PR에 게시하는 함수
async function postReviewComment(octokit, owner, repo, pullRequestNumber, file, reviewMessage) {
  core.info(`Posting review comment for file: ${file.filename}`); // 디버깅 구문
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullRequestNumber,
    body: reviewMessage,
  });
  core.info(`Comment posted for file: ${file.filename}`); // 디버깅 구문
}

app();
