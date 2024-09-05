/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 901:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 790:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(901);
const github = __nccwpck_require__(790);

async function run() {
  try {
    // GitHub 토큰 가져오기
    const token = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(token);

    // PR 정보 가져오기
    const { context } = github;
    const pullRequestNumber = context.payload.pull_request.number;
    const repo = context.repo.repo;
    const owner = context.repo.owner;

    // PR의 변경된 파일 목록 가져오기
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullRequestNumber,
    });

    // 각 파일을 검사
    files.forEach((file) => {
      if (!file.filename.endsWith(".yaml")) {
        core.info(`Skipping non-JS file: ${file.filename}`);
        return;
      }

      // 여기에 코드 리뷰 로직 추가 (예: ESLint로 검사)
      // 이 예제에서는 간단히 파일명을 출력
      core.info(`Reviewing file: ${file.filename}`);
    });

    // 리뷰 결과에 따라 PR에 댓글 달기
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullRequestNumber,
      body: "Code review completed.",
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

})();

module.exports = __webpack_exports__;
/******/ })()
;