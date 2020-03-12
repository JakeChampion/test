const core = require("@actions/core");
const github = require("@actions/github");
const semver = require("semver");
// const git = require("simple-git")();

const { promisify } = require("util");

// const getTags = promisify(git.tags.bind(git));

const exec = promisify(require("child_process").exec);

async function main() {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;

    const labels = payload.pull_request.labels.map(label => {
      return label.name;
    });
    console.log({ labels });

    if (!labels) {
      console.log(
        "no version label set. Cancelling automated versioning action."
      );
      return;
    }

    const major = labels.includes("major");
    const minor = labels.includes("minor");
    const patch = labels.includes("patch");

    console.log({ major, minor, patch });

    if (!major && !minor && !patch) {
      console.log(
        "no version label set. Cancelling automated versioning action."
      );
      return;
    }

    // get previous tag
    const { stdout: tags } = await exec(
      "git describe --tags `git rev-list --tags --max-count=1`"
    );
    const version = semver.coerce(tags.split("\n")[0]);

    if (major) {
      // 'major' | 'premajor' | 'minor' | 'preminor' | 'patch' | 'prepatch' | 'prerelease'
      version.inc("major");
    } else if (minor) {
      version.inc("minor");
    } else if (patch) {
      version.inc("patch");
    }
    console.log({ version, labels, major, minor, patch });

    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    // const myToken = core.getInput("myToken");

    // const octokit = new github.GitHub(myToken);

    const { stdout } = await exec(
      `git tag ${version.version}`
    );

    console.log({stdout});

    const { stdoutt } = await exec(
      `git push --tags`
    );

    console.log({stdoutt});
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
