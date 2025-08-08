# SrijanMithila Backend Setup and Deployment Guide

## Prerequisites

Before setting up the backend project, ensure the following tools and software are installed:

1. **Node.js** (LTS version recommended)

   - Download from [Node.js Official Website](https://nodejs.org/).
   - Check version:
     ```bash
     node -v
     npm -v
     ```

2. **Package Manager**

   - Use `npm` (default) or `yarn` if preferred:
     ```bash
     npm install -g yarn
     ```

3. **Git**

   - For version control: [Git Official Website](https://git-scm.com/)

4. **MongoDB Atlas**
   - Set up a MongoDB cloud database at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a `.env` file to store your MongoDB URI and other secrets.

---

## Project Setup

### 1. Clone the Repository

````bash
git clone https://github.com/your-username/srijanMithilaBackend.git
cd srijanMithilaBackend


### 2. Setting Up Upstream for Your Fork
- Add upstream for ypur project repository:
  ```bash
  git remote add upstream https://github.com/original-owner/srijanMithilaBackend.git

### 3. Create branch
- Create your own branch for project repository
  ```bash
  git checkout -b your-feature-branch

### 4. Add your task
- Add the updated task:
  ```bash
  git add .

### 5. Committing the task
- Commit the task with some meaningful message:
  ```bash
  git commit -m 'Description of changes'

### 6. Push the task
- Push your updated task:
  ```bash
  git push origin your-feature-branch

### 7. Pull Request
Then create a pull request on GitHub

````
