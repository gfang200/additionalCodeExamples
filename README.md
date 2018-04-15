Hacks, Experiments, and Scripts
============
This repository contains interesting work that I've done over the years. The code that you'll find here definitely highlights my top strengths, intellectual curiosity, coding chops, scripting & scraping, some data structure/algo implemetnation, general tomfoolery, and just building really cool stuff.

Interesting Singletons
--------------- 
#### geneticAlgorithm.py #### 
Implementation of the basic concepts of genetic algorithms. Not super complex, but still pretty cool. Starting from a base population of random strings, I use a basic fitness function and roulette sampling to randomly breed high scoring strings from the population. This continues until an optimal solution is found (the solution string is reached).    <br/><br/>(Built this after playing Spore in college. <:^))

#### plagiarismDetector.py ####
Object oriented implementation of an n-gram analysis on student programming assignments to detect plagiarism. I built this after I found a few students cheating in a programming class I lead as an undergraduate instructor. Uses an implementation of unionFind to group students together with similar assignments.

#### insertMerge.py ####
An exercise I got during a whiteboarding interview to merge overlapping tuples. I thought it was an interesting problem, so I built out the implementation after the interview.

Sample Projects
--------------- 
#### Scraping and Scripting #### 
A select sample of scripts that I've written to scrape the web. It includes examples of:  
* Working with iFrames in Selenium
* Overcoming shadow root nodes in the DOM by dynamically generating xdotool shell scripts.
* Recursive search in web scraping
* Basic URLLib usage to scrape metadata & download images 

#### DatastudioTools #### 
This one's got a pretty cool story! While doing consulting work for Accenture, one of my clients had her heart set on downloading graphs from one of Google's analytics tool, Datastudio. Unfortunately, the product did not support this feature. <br/><br/>The rational course of action here would be to give up, but instead of that I build a tool that pulls in SVG images, extracts the vector & text data, and finally redraws the image on a PNG, thus rendering the image in a downloadable state. Bonus points since it supported transparency layers too!

#### GameLTVModel #### 
This is an early version of a model I developed alongside a data scientist. It is designed to calculate the player lifetime value for a mobile game based on the initial actions of the user. As the data engineer on this engagement, my main role on the team was to translate the model into Python code, transform training data into a consumable state, build back-testing modules, and deploy the code into a live production environment.  <br/><br/>*Note that this is an alpha version of the model, for confidentiality reasons, I can't share the full model!

#### selectWorksFromFreemo #### 
A few select code samples from a WebApp project I've been working on recently in NodeJS. In summary, it's an app that runs selenium scripts on a scalable kubernetes cloud container engine to interact with web models at scale. The project's very very early in pre-alpha-closed-beta, but you can still check out the site @ www.tryfreemo.com :)

#### excelHomeworkHacking #### 
This one is pretty troll. I was a TA for a business excel class once where the professors were **SUPER** proud of these xslm macros they created to detect cheating in their classrooms. They would spend a few hours every semester talking about how the system couldn't be beaten. After watching some bankers use excel without a mouse, I used a windows scripting language that supported hardware emulation to create a system that emulated keyboard inputs to complete homework assingments.  I never distributed this to students, since I don't condone cheating, but it was pretty trollerino to show the professors that I could beat their system.

#### BONUSreallyCoolExcelModel #### 
This one's not even code. I found this in one of my old desktop backups while looking for cool stuff to include in my GitHub.    <br/><br/>Before I learned how to code, I learned how to excel. I also didn't let my lack of knowledge of fully functional programming languages stop me from doing cool stuff. One of the things I noticed through observation is that some professors are more lenient graders than other professors. Then, I built this slick, 9 page excel model that took anonymized student GPA data and determined the best professor for each class based on difficulty xD.
