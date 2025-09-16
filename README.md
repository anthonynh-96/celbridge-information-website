Celbridge & Castletown House Website

This project is a website I built for my UCD Front End Web Development course. Since I’ve lived in Celbridge my whole life, I wanted to create something that showcases the town’s history, heritage, and landmarks, with a special focus on Castletown House.

The site has multiple pages (Home, History, Castletown House, Main Street, William Conolly, Arthur Guinness, etc.) and includes galleries, “Did You Know” sections, breadcrumbs navigation, and a blog page powered by a small REST API.

Features

Responsive design with Bootstrap and custom CSS

Dynamic galleries with hover effects

Breadcrumbs navigation to track where you are in the site

Flipbook-style image sections

REST API blog (works locally only)

Historical information, quick facts, and interactive widgets

Tech Stack

HTML, CSS, JavaScript

Bootstrap (styling and layout)

Node.js & Express (for REST API)

Getting Started  
Downloading the Project

Go to this repo on GitHub.

Click the green Code button.

Choose either:

Download ZIP and extract it, or

Copy the HTTPS/SSH link and run:

git clone \<your-repo-link\>

Running the Website (Static Pages)

If you just want to look at the site itself, open index.html in your browser.

Most of the pages will work fine this way.

Running the REST API (Blog Page)

The blog/forum part of the site only works on a local server because it uses a REST API.

Make sure you have Node.js  
 installed.

Open a terminal in the project folder.

Install dependencies:

npm install

Create a .env file in the root folder (this is where your environment variables go).  
Example:

PORT=3000

Start the server:

npm run dev

Open http://localhost:3000  
 in your browser.

Now you can access the blog/forum page.

⚠️ Important: On GitHub Pages or any other static host, the REST API part will not work. It needs a server running locally (or deployed separately on a hosting service like Render, Vercel, or Heroku).

Project Structure  
/assets  
   /css  
   /js  
   /images  
/api  
   server.js  
   routes.js  
   ...  
index.html  
home.html  
castletown.html  
...

Known Limitations

REST API blog page won’t work online unless deployed on a server.

Some features may look slightly different on mobile compared to desktop.

Credits

Content and images from Celbridge history & Castletown House references

Bootstrap for styling

Node/Express for backend API

