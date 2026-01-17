# Git Commit Guidelines

## What Should Be Committed ✅

### Source Code
- All `.java` files in `Server/src/`
- All `.js`, `.jsx`, `.ts`, `.tsx` files in `Client/src/`
- Configuration files: `package.json`, `pom.xml`, `application.properties`
- Scripts: `start.sh`, `start.bat`, `start-postgres.sh`
- Build configuration: `build.xml`, `.gitignore`
- Documentation: All `.md` files, images in `Documentation/`
- Design files: `.png`, `.jpg` (if they're part of the project)

### Configuration Files
- `package.json` (both root and Client)
- `pom.xml`
- `application.properties`
- `.gitignore`
- `build.xml`

### Documentation
- `README.md`
- All files in `Documentation/` folder
- Design documents and images

## What Should NOT Be Committed ❌

### Dependencies (Auto-generated)
- `node_modules/` - npm packages (installed via `npm install`)
- `package-lock.json` - Lock file (optional, some teams commit this for consistency)
- Maven dependencies in `~/.m2/` (local Maven repository)

### Build Artifacts
- `Server/target/` - Maven build output
- `Client/build/` - React build output
- `*.class` - Compiled Java files
- `*.jar`, `*.war`, `*.ear` - Java archives

### Log Files
- `Server/server-logs/*.log`
- `Client/client-logs/*.log`
- `Server/server-logs/db-setup.log`
- Any other `*.log` files

### IDE and Editor Files
- `.idea/` - IntelliJ IDEA
- `.vscode/` - Visual Studio Code
- `*.iml`, `*.ipr`, `*.iws` - IntelliJ project files
- `.classpath`, `.project` - Eclipse files
- `*.swp`, `*.swo` - Vim swap files

### OS Files
- `.DS_Store` - macOS
- `Thumbs.db` - Windows
- `Desktop.ini` - Windows

### Environment and Secrets
- `.env` files
- `.env.local`, `.env.development.local`, etc.
- Any files containing passwords, API keys, or secrets

### Temporary Files
- `*.tmp`, `*.temp`
- `*.bak`, `*.backup`
- `*.pid`, `*.seed`

## Current .gitignore Configuration

The `.gitignore` file is configured to automatically exclude:
- All log files
- `node_modules/` directories
- Maven `target/` directories
- IDE configuration files
- OS-specific files
- Build artifacts

## Quick Check Before Committing

Before committing, run:
```bash
git status
```

You should see:
- ✅ Modified source files (`.java`, `.jsx`, `.ts`, etc.)
- ✅ Modified configuration files
- ✅ New documentation files
- ❌ NO `node_modules/` directories
- ❌ NO `target/` directories
- ❌ NO log files
- ❌ NO `.DS_Store` or IDE files

## If You See Unwanted Files

If you see files that shouldn't be committed:

1. **Check if they're in .gitignore:**
   ```bash
   git check-ignore -v <filename>
   ```

2. **If not ignored, add to .gitignore:**
   ```bash
   echo "filename" >> .gitignore
   ```

3. **Remove from git tracking (if already committed):**
   ```bash
   git rm --cached <filename>
   git commit -m "Remove generated files from tracking"
   ```

## Best Practices

1. **Always review `git status` before committing**
2. **Never commit:**
   - Dependencies (`node_modules/`, Maven dependencies)
   - Build artifacts (`target/`, `build/`)
   - Log files
   - Personal IDE settings
   - Secrets or environment variables

3. **Do commit:**
   - Source code changes
   - Configuration changes
   - Documentation updates
   - Script improvements

## Example: What to Commit After Running Scripts

After running `./start.sh`, you might see:
```
M  start.sh              ✅ Commit (script improvements)
M  README.md             ✅ Commit (documentation updates)
M  .gitignore            ✅ Commit (ignore rules)
?? node_modules/         ❌ Ignored (auto-generated)
?? package-lock.json     ❌ Ignored (auto-generated)
?? Server/target/        ❌ Ignored (build output)
?? Server/server-logs/   ❌ Ignored (log files)
```

Only commit the files marked with ✅.
