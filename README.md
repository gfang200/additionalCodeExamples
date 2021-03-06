Hacks, Experiments, and Scripts
============
This repository contains a sample of the interesting work that I've done over the years. The code that you'll find here highlights my biggest strengths: intellectual curiosity, coding chops, scripting & scraping, good foundations, general tomfoolery, and just building really cool stuff.

Singleton Highlights
--------------- 
#### geneticAlgorithm.py #### 
Implementation of the basic concepts of genetic algorithms. Just an exercize, but still pretty cool IMO. Starting from a base population of random strings, I created a basic fitness function and used roulette sampling to randomly breed high scoring strings from the population until an optimal solution is found (the solution string is reached).

#### plagiarismDetector.py ####
Object oriented implementation of an n-gram analysis to detect plagiarism in code. As a lead undergraduate instructor, I built this after I found a few students cheating on their programming assignments. Uses an implementation of unionFind to group students together with similar assignments.

#### insertMerge.py ####
An exercise I got during a whiteboarding interview to merge overlapping tuples. I thought it was an interesting problem and I wanted to figure it out, so, I finished the code after the interview.

Sample Projects
--------------- 
#### Scraping and Scripting #### 
A select sample of scripts that I've written to scrape the web. It includes examples of:  
* Working with iFrames in Selenium
* Overcoming shadow root nodes in the DOM by dynamically generating xdotool shell scripts.
* Recursive search in web scraping
* Basic URLLib usage to scrape metadata into XML & download images 

#### selectWorksFromFreemo #### 
A few select code samples from a WebApp project I built in NodeJS. In summary, it's an app that runs selenium scripts on a scalable kubernetes cloud container engine to interact with web models at scale. There's a few examples of back-end controllers, as well as a few examples of front end work using partials and swig.

#### DatastudioTools #### 
This one's got a pretty cool story! While doing consulting work for Accenture, one of my clients had her heart set on downloading graphs from one of Google's analytics tool, Datastudio. Unfortunately, the product did not support this feature. <br/><br/>Of course, the rational course of action here would be to give up and explain that it's not possible, but instead of that I build a tool that pulls in SVG images, extracts the vector & text data, and finally redraws the image on a PNG, thus rendering the image in a downloadable state. Bonus points since it supported transparency layers too!

#### GameLTVModel #### 
This is an early version of a model I developed alongside a data scientist. It is designed to calculate the player lifetime value for a mobile game based on the initial actions of the user. As the data engineer on this engagement, my main role on the team was to translate the model into Python code, transform training data into a consumable state, build back-testing modules, and deploy the code into a live production environment.  <br/><br/>*Note that this is an alpha version of the model, for confidentiality reasons, I can't share the full model!

#### excelHomeworkHacking #### 
This one is pretty troll. I was a TA for a business excel class once where the professors were **SUPER** proud of these xslm macros they created to detect cheating in their classrooms. They would spend a few hours every semester talking about how the system couldn't be beaten. After watching some bankers use excel without a mouse, I used a windows scripting language that supported hardware emulation to create a system that emulated keyboard inputs to complete homework assingments.  I never distributed this to students, since I don't condone cheating, but it was pretty trollerino to show the professors that I could beat their system.

#### BONUSreallyCoolExcelModel #### 
This one's not even code. I found this in one of my old desktop backups while looking for cool stuff to include in my GitHub.    <br/><br/> Before I learned how to code, I learned how to excel. I also didn't let my lack of knowledge of fully functional programming languages stop me from doing cool stuff. One of the things I noticed through observation is that some professors are more lenient graders than other professors. Then, I built this slick, 9 page excel model that took anonymized student GPA data and determined the best professor for each class based on the incoming and outgoing average GPA.
<br/><br/>  I though it was pretty cool, so I included it in my repo.
