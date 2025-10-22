# Git-based deployment

## Option A: Bare repo + post-receive (on VPS)

1. On VPS (once):

```bash
sudo mkdir -p /var/repos /var/www/kasyrooms
sudo chown -R $USER:$USER /var/repos /var/www/kasyrooms
cd /var/repos
mkdir -p kasyrooms.git && cd kasyrooms.git
git init --bare
cp /path/to/workspace/scripts/post-receive.sample hooks/post-receive
chmod +x hooks/post-receive
```

2. From local, add remote and push:

```bash
git remote add vps ssh://<user>@<host>/var/repos/kasyrooms.git
git push vps main
```

3. The post-receive hook will checkout to /var/www/kasyrooms and run scripts/deploy.sh.

## Option B: GitHub Actions (SSH deploy)

Create repository secrets:
- VPS_HOST
- VPS_USER
- VPS_SSH_KEY (private key content)
- VPS_APP_DIR (e.g., /var/www/kasyrooms)
- VPS_PORT (optional, default 22)

Then adjust `.github/workflows/deploy.yml` as needed and push to main.
