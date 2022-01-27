<div align="center">
  <img src="icons/rute.svg" width="150" alt="">

  ## Rute Map
  
  🇧🇼  Botswana's Public Transport Reference  🚌 

</div>

Rute Map is a tool to search routes and kombi (mini-bus) stops in Botswana. By crowdsourcing information, it aims to collect the location of stops and routes which pass through to chart an easily accessible network of kombi routes. 

![Screenshot](https://user-images.githubusercontent.com/76803540/125441471-10982ea6-c6de-4a14-a4a3-0334be1e40c3.png)


## 🗺️ Reference Features
- kombi stop markers are precise to the location on the ground. You can toggle to the satellite to make sure
- drop-down index of route areas
- click a stop tow see the routes which pass through it
- display the length of a route by searching the database

## 💁‍♀️ Crowdsourcing Features
- add a kombi stop by dropping a leaflet marker
- name a stop, preferably after its immediate surroundings. 
- add the routes which pass through a stop, or mutiple stops

## 🔨 Contributing

At this stage, the easiest and best way to contribute is to add more routes and stops to the map. Verifing routes and flag mistakes or false information. 

Bug reports and additions or enhancements to the site are very welcome. Please open an issue. 

## 👩‍💻 Installation
1. Clone the repo

``` 
https://github.com/gala-m/Rute-Map.git 
```

2. Download the data tables mentioned below. Set up your own [CartoDB](https://carto.com/login) profile and import these tables to your profile to query the data. 
To ensure that the sql stored procedures called in the main.js work properly, keep the columns the same. 

3. In main.js, replace 'winni' with your Carto username

``` 
let url1 = "https://[username].carto.com/api/v2/sql"; 
```


## 🗄️ Data
Some stops were scraped from OSM data. All the data is avaliale in public CartoDB tables. 
These are [stops](https://winni.carto.com/tables/points/public), [route](https://winni.carto.com/tables/route/public), [names](https://winni.carto.com/tables/names/public). 

You can query the tables for other use. 


## 🎤 Feeback & Questions
For questions and feedback you can use the discussions forum.
