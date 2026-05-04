# Lab-302

Stats:
* Model choice: Claude Opus 4.7
* Initial requirements.md creation: 1.6 credits, 1:24min
* Additional guidance prompt, requirements.md update: 1.21 credits, 2:00min
* design.md creation: 1.8 credits, 3:51min
* tasks.md creation: 1.58 credits, 1:51min
* updating tasks.md based on steering doc "additional-steering.md": 4.47 credits, 5:26min
* Task 1: 2.33 credits, 2:48min
* Create docs/README.md and docs/README_PL.md: 2.28 credits, 1:38min
* Task 2: 4.47 credits, 2:00min
* Task 3: 2.43 credits, 1:56min
* Task 4: 3.07 credits, 5:11min
* Tasks 5 and 6: 11.11 credits, 3:00min
* Credit cost with Kiro Pro license: US$0.02 per 1 credit.
* Rough token-to-credit relationship, based on above steps up until "updating tasks.md": 13,000 tokens = 16 credits

Prompt:
```
Create a simple weather app that displays current weather conditions 
when the user enters a city name in the United States. It should use 
a publicly available government website as the source for weather and 
city names. Build it using HTML and JavaScript and host it by running a 
shell script to start an HTTP server on localhost:8080.
```
Add to requirements.md:
```
Additional guidance:
- Show the 5 day forecast. Use table format to display the results.
- Add appropriate graphics for sunny, rainy, cloudy, etc.
- Early in the development, once basic functionality should be working, 
show the prototype web app in a web browser to allow me to test it. 
- Keep the development quick and simple. 
- There should be no more than 5 requirements and no more than 6 tasks.
```
Agent Hook prep:
```
Create documentation of this project in docs/README.md in English language
```
Agent Hook, actual hook creation:
```
Whenever the English documentation under docs/README.md is changed, also update the Polish one in docs/README_PL.md
```
Create a new steering doc named like this:
```
additional-steering.md
```
contents:
```
- Keep the design simple. 
- Use HTML and JavaScript to build the app. 
- Do not implement caching or classes or interfaces. 
- Limit the unit test code to only basic testing. The goal is to complete the project in 20 minutes.
- Do not hardcode or store city names in the web app code. Instead pass city names entered by the web app UI end user directly to the National Weather Service API. 
- If you face path issues trying to start the web app, create a batch script to start the web app.
- Avoid CORS errors by using Nominatim geocoding.
- Run the app on localhost:8080 using a shell script to start a local HTTP server.
```
Point Kiro to the new steering doc:
```
Please read the steering documents. Follow the guidance provided when we are ready to generate tasks.
```
Start:
```
Start the application
```
