## **Documentation Report**

This site started as part of my UCD front end web development course. I picked Celbridge cause its my home town and I know the stories and landmarks very well. The project grew over time and I ended up adding more and more pages like Castletown House William Conolly Arthur Guinness and the local main street.

The site uses regular HTML CSS and JavaScript and I also included a REST API for the blog part. The blog section only works when running locally as Github pages does not support the server side features.

### **How to Run**

* Download the project from the Github repo (https://github.com/anthonynh-96/celbridge-information-website)

* Open the main index file in a browser to view the static pages

* For the blog run `npm install` and then `npm run dev` in the project folder. That will start the local server and let you access the forum.

### **File Structure**

* **index.html** → intro page with title and background

* **home.html** → the main homepage with links out to all other pages

* **/pages** → all the history sections like Castletown main street Conolly and Guinness

* **/assets** → images css and javascript files

* **/api** → where the rest api code is kept for the blog

### **Notes**

Because the CSS file got massive over time I split some styling into inline css inside certain pages just to keep things working. Also some paths changed when I restructured so always double check the `../` in the links if something does not load.

This documentation is mainly for me and anyone looking at the project later so they understand how I built it and what needs to be done if they want to run it locally.

