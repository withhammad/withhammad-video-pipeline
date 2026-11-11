"""Exercise the timer's Git step without invoking the live posting command."""
import os
import subprocess
from pathlib import Path


def test_timer_commit_leaves_other_staged_work_untouched(tmp_path):
    env = {**os.environ, "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull}

    def git(*args):
        return subprocess.run(
            ["git", "-C", str(tmp_path), *args], check=True,
            capture_output=True, text=True, env=env,
        ).stdout.strip()

    git("init", "-q")
    git("config", "user.name", "Timer Test")
    git("config", "user.email", "timer@example.invalid")
    queue = tmp_path / "outputs/video-pipeline/repost-queue.json"
    queue.parent.mkdir(parents=True)
    queue.write_text('{"posted": []}\n')
    git("add", "--", str(queue.relative_to(tmp_path)))
    git("commit", "-q", "-m", "Initialize queue")

    queue.write_text('{"posted": ["example"]}\n')
    (tmp_path / "unfinished-edit.txt").write_text("Another session's staged work\n")
    git("add", "--", "unfinished-edit.txt")

    script = Path(__file__).resolve().parents[1] / "run_due.sh"
    commit_step = next(
        line.strip() for line in script.read_text().splitlines()
        if line.strip().startswith('git -C "$ROOT" commit ')
    )
    subprocess.run(
        ["bash", "-c", commit_step], check=True,
        env={**env, "ROOT": str(tmp_path), "IDS": "example", "LOG": str(tmp_path / "timer.log")},
    )

    assert git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD") == str(queue.relative_to(tmp_path))
    assert git("diff", "--cached", "--name-only") == "unfinished-edit.txt"
    assert git("show", "HEAD:" + str(queue.relative_to(tmp_path))) == '{"posted": ["example"]}'
