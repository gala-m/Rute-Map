import * as React from 'react'
import { useEffect, useState } from 'preact/hooks';

import rute from '../../icons/rute.svg'
import bus from '../../icons/bus.png'

import fetchCache from '../../utils/fetchCache'

mapboxgl.accessToken = config.MAPBOX_TOKEN;

const CACHE_TIME = 24 * 60;

let welcomeMessage;
if (localStorage.getItem("firstTime") == null) {
    welcomeMessage = <div id="welcome" >
                        <div>
                            <span id='close' style="top: 0px; cursor: pointer;" onclick={() => {closeWelcome(); return false;}}>x</span>  
                            <div>Welcome to Rute Map. Click on a kombie route below, or hover over over a blue stop to get started. </div>                            
                        </div>
                    </div>
    localStorage.setItem("firstTime","done");
}

function closeWelcome() {
    document.getElementById('welcome').style.display = 'none';;
}

const desktop = window.matchMedia( "(min-width: 601px)" );

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/winniatthepark/ckxybpudc70p014tl0v5b7j5d',
    center: [25.90816497802734, -24.65559807941307],
    zoom: 12
});

const draw = new MapboxDraw({
    displayControlsDefault: false
});

map.addControl(draw);
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: false,
    showUserHeading: true
}));

map.on('mouseenter', 'routeLines', () => {
    map.getCanvas().style.cursor = 'pointer';
});
 
map.on('mouseleave', 'routeLines', () => {
    map.getCanvas().style.cursor = '';
});

map.on('mouseenter', 'points', () => {
    map.getCanvas().style.cursor = 'pointer';
});
 
map.on('mouseleave', 'points', () => {
    map.getCanvas().style.cursor = '';
});

const routesArray = []
const ranksArray = []

var azSorter = [];
var az = [];

function arrayPusher(it, arr) {
    for (const val of it) {
        arr.push(val)
    }
}

export default function Content() {

    const [ prevSelect, setPrevSelect ] = useState(null);
    const [ routeView, setRouteView ] = useState(null);
    const [ rank1, setRank1 ] = useState("");
    const [ rank2, setRank2 ] = useState("");
    const [ complete, setComplete] = useState(true);
    const [ component, setComponent ] = useState("0");
    const [ prevComponent, setPrevComponent] = useState("2");
    const [ done, toggleDone ] = useState(false)
    const [ report, setReport ] = useState("")

    const onLoad = async () => {

        const dataPath = 'https://rute-map.herokuapp.com/data/';
        const routesPath = dataPath + 'routes3';
        const stopsPath = dataPath + 'points';
        const ranksPath = dataPath + 'ranks'
        const rankPointsPath = dataPath + 'rankpoints'

        const fetchRoutes = fetchCache(routesPath, CACHE_TIME);
        const fetchStops = fetchCache(stopsPath, CACHE_TIME)   
        const fetchRanks = fetchCache(ranksPath, CACHE_TIME) 
        const fetchRankPoints = fetchCache(rankPointsPath, CACHE_TIME) 

        const data = {
            stops: await fetchStops,
            routes: await fetchRoutes, 
            ranks: await fetchRanks, 
            rankPoints: await fetchRankPoints
        }

        return data
    }
    
    useEffect(() => {
        onLoad().then((value) => {

            const rawRoutes = value.routes.features
            const iterator = rawRoutes.values();

            const rawRanks = value.ranks.features
            const iterator2 = rawRanks.values();

            arrayPusher(iterator, routesArray)
            arrayPusher(iterator2, ranksArray)

            map.on('load', () => {
                map.addSource('points', {
                    'type': 'geojson',
                    'data': value.stops
                })

                map.addLayer({
                    'id': 'points',
                    'source': 'points',
                    'type': 'circle',
                    'paint': {
                        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 5],
                        'circle-color': '#0b1e57', 
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }                    
                });

                map.addSource('routes', {
                    'type': 'geojson',
                    'data': value.routes, 
                    lineMetrics: true,
                });    
                
                map.addLayer({
                    'id': 'routesLayer',
                    'type': 'line',
                    'source': 'routes',
                    'layout': {
                        'line-cap': 'round',  
                        'visibility': 'none'          
                    },
                    'paint': {
                        'line-color': '#07143b',
                        'line-width': 2,
                        'line-gradient': [
                            'interpolate',
                            ['linear'],
                            ['line-progress'],
                            0,
                            '#07143b',
                            1,
                            '#7f0f2f',
                        ],
                    }
                }); 

                changeComponent("1")

                map.addSource('ranks', {
                    'type': 'geojson',
                    'data': value.ranks, 
                });    
                
                map.addLayer({
                    'id': 'ranksLayer',
                    'type': 'fill',
                    'source': 'ranks',
                    'paint': {
                        'fill-color': '#7f0f2f',
                        'fill-antialias': true,
                        'fill-outline-color': '#ffffff',
                        'fill-opacity': 0.3
                    } 
                }); 
                
                map.addLayer({
                    'id': 'text',
                    'type': 'symbol',
                    'source': 'ranks',
                    'paint': {
                        'text-halo-width': 2,
                        'text-halo-color': '#ffffff'                    
                    },
                    'layout': {
                        'icon-image': "rbus",
                        'icon-size': 0.2,
                        'icon-offset': [20,-20],
                        'text-field': ['get', 'rank'], 
                        'text-anchor': 'bottom-left',
                        'text-offset': [1.5,-0.6],
                        'text-font': ['DIN Pro Regular'],
                        'visibility': 'none' 
                    }
                });  

                map.addSource('rankPoints', {
                    'type': 'geojson',
                    'data': value.rankPoints, 
                }); 

                map.addLayer({
                    'id': 'marker',
                    'type': 'circle',
                    'source': 'rankPoints',
                    'paint': {
                        'circle-color': 'rgb(255, 255, 0 0)', 
                        'circle-opacity': 0,
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#0b1e57'
                    },
                    'layout': {  
                        'visibility': 'none'          
                    }, 
                }); 
            })

            const OutRoutes = routesArray.filter(element => element.properties.direction === "Out")

            const iterator3 = OutRoutes.values();

            for (const value of iterator3) {
                azSorter.push(value.properties.name)
            }

            azSorter.sort()

            var current_number='1'

            for (var i = 0; i < azSorter.length; i++) {
                if(azSorter[i].charAt(0)!=current_number){
                    az.push(azSorter[i])
                }
            } 
         
        })
    }, []);   

    const RouteList = az.map((element, i) =>
        
        (   
            <div name="barHolder" className="barHolder" >
                <div className="bar" key={element} id={element} onClick={() => clickedRoute(element, i)} >
                    <div>{element}</div>
                        { element === routeView && (
                            <div class="routeInfo">
                                <br/>
                                <div>
                                    <img alt='busrankicon' src={bus} class="rankicon" />
                                    Loads at <br/>{rank1}   <i class="fas fa-exchange-alt"></i>   {rank2}</div>
                                <br/>
                                <div class='actionContainer' >{ complete ? 
                                    <button class='viewRouteAction' onClick={() => {setReport('The problem with ' + element + ' is' ); changeComponent("3")}} >
                                        Is this route incorrect? 
                                        <div class="actionButton">
                                            Report it <i class="fas fa-flag"></i>
                                        </div>
                                    </button> 
                                    : 
                                    <div>
                                        This route is incomplete.
                                        <br /><br />
                                        <button class='actionButton' style={"padding: 25px"} onClick={() => changeComponent("2")} >
                                            <b> Add to it </b>
                                            <i class="fas fa-pen fa-beat-fade fa-2xl" style="--fa-beat-fade-opacity: 0.67; --fa-beat-fade-scale: 1.1" ></i>
                                        </button>
                                    </div> }
                                </div> 
                            </div>

                        )}
                </div>            
            </div>
        )
    )    

    function reset() {
        document.getElementById(prevSelect).style.cursor = 'pointer'
        document.getElementById(prevSelect).style.borderLeft = 'none rgba(252, 251, 249, 0)'
    }

    const clickedRoute = (name) => {
        
        if (prevSelect != null) {
            reset()
        }

        setRouteView(name)

        document.getElementById(name).style.borderLeft = 'solid #040b21'
        document.getElementById(name).style.cursor = 'auto'

        const matchedRoute = routesArray.filter(element => element.properties.name === name)

        const statusFinder = matchedRoute[0].properties.status

        if (statusFinder === "Complete") {
            setComplete(true)
        } else {
            setComplete(false)
        }

        const array = matchedRoute[0].geometry.coordinates
        const coord1 = matchedRoute[0].geometry.coordinates[0]
        const lastCoord = array.length - 1;
        const coord2 = matchedRoute[0].geometry.coordinates[lastCoord]

        map.setFilter('routesLayer', ['==', ['get', 'name'], name]);
        map.setLayoutProperty('routesLayer', 'visibility', 'visible');
        map.moveLayer('routesLayer', 'points');

        map.easeTo({
            center: coord1,
            speed: 1,
            curve: 1,
            easing(t) {
                return t;
            }
        });

        map.fitBounds([coord1, coord2], {
            padding: { left: 400, right: 200, top: 100, bottom: 100 }
        });


        setPrevSelect(name)

        const matchedRank = ranksArray.filter(element => element.properties.name.includes(name))

        const layerArray = ['marker', 'text', 'ranksLayer'];

        if (matchedRank.length === 2) {
            setRank1(matchedRank[0].properties.rank)
            setRank2(matchedRank[1].properties.rank)

            layerArray.forEach(element => {
                map.setFilter(element, ["any", 
                    ['==', ['get', 'name'],  matchedRank[0].properties.name],
                    ['==', ['get', 'name'],  matchedRank[1].properties.name] 
                ]);  
            });          

        } else {
            setRank1(matchedRank[0].properties.rank)
            setRank2('') 

            layerArray.forEach(element => {
                map.setFilter(element, ["any", 
                    ['==', ['get', 'name'],  matchedRank[0].properties.name]
                ]);  
            });  
                      
        }

        map.setLayoutProperty('marker', 'visibility', 'visible'); 
        map.setLayoutProperty('text', 'visibility', 'visible');
        map.setPaintProperty('ranksLayer', 'fill-opacity', 0.8);        
    }

    map.on('draw.create', () => {toggleDone(true)})

    const DrawContainer = () => {

        const [ save, toggleSave ] = useState(false);
        const [ table, setTable ] = useState('');
        const [ tipToggle, setTip ] = useState(false);
        const [ cancel, setCancel ] = useState(false);
        const [ data, setData ] = useState({
            name: '', 
            routes: '', 
            email: ''
        })

        function innerDraw(para) {
            draw.changeMode(para);
            setTable(para)
            setTip(true)
            setCancel(true)

            var buttons = drawModes.querySelectorAll("button");

            buttons.forEach(function(button) {
                var id = document.getElementById(button.id)
                id.style.cursor = 'auto'
                id.style.color = 'grey'
                id.disabled = true;
            })
        }  

        const handleChange = (e) => {

            const value = e.target.value
            setData({
                ...data,
                [e.target.id]: value
            })
        }

        function resetButtons() {
            var buttons = drawModes.querySelectorAll("button");

            buttons.forEach(function(button) {
                var id = document.getElementById(button.id)
                id.style.cursor = 'pointer'
                id.style.color = '#040b21'
                id.disabled = false;
            })
        }

        function handleCancel() {
            draw.deleteAll()
            draw.changeMode('simple_select');
            toggleDone(false)
            toggleSave(false)
            setTip(false)
            setCancel(false)
            resetButtons()
        }

        const tipRadio = (
            <div id="radioMenu" >
                <input id="satellite-v9" type="radio" name="rtoggle" value="satellite" onclick={() => map.setStyle('mapbox://styles/mapbox/satellite-v9')} />
                <label for="satellite-v9">satellite</label>
                <input id="roads" type="radio" name="rtoggle" value="roads" onclick={() => map.setStyle('mapbox://styles/winniatthepark/ckxybpudc70p014tl0v5b7j5d')} checked="checked" />
                <label for="roads">roads</label>
            </div>                
        )

        switch (table) {
            case 'draw_point':
                tip = <div>Switch to satellite map to see the stops on the ground {tipRadio}</div>
                addName = <label for="name">Give this stop a name</label>;
                addRoutes = <label for="routes">Which routes pass through this stop? (Separate with commas)</label>
                break;

            case 'draw_line_string':
                tip = <div>Press Enter when done</div>
                addName = <label for="name">Name of Route</label>;
                addRoutes = ''
                break;

            case 'draw_polygon':
                tip = <div>
                        <div>Switch to satellite map to see the rank on the ground {tipRadio}</div>
                        <br/>
                        <div>Press Enter when done</div>
                    </div>
                addName = <div><label for="name">Name of Rank</label><br/></div>;
                addRoutes = <label for="routes">Which routes load at this rank? (Separate with commas)</label>
                break
        }

        function drawHandler(table, properties) {
            const data = draw.getAll();

            const obj = {
                table: table,
                properties: properties, 
                geom: data.features[0].geometry
            }

            savePoints(obj)
        }

        function savePoints(obj) {

            $.post("https://rute-map.herokuapp.com/saver", obj,
                function () {

                    alert("You contribution has been saved. Thank you!")  
                    handleCancel()       
                }
            );
        } 

        return (
            <div>
                { desktop.matches ? 
                    <div>
                        <div id="drawModes" >
                            <button id="draw_polygon" class="button" onClick={() => innerDraw("draw_polygon")} >Draw a Rank</button> 
                            <br/>
                            <button id="draw_line_string" class="button" onClick={() => innerDraw("draw_line_string")} >Draw a Route</button>  
                            <br/>     
                            <button id="draw_point" class="button" onClick={() => innerDraw("draw_point")} >Draw a Stop</button>                        
                        </div>
                        <div>
                            { tipToggle && ( 
                                <div id="tip" class="next"> { tip } </div> 
                            )}
                            { done && (
                                <div class="button" style="padding:25px; padding-left:15px;" onClick={() => {toggleDone(false); setTip(false); toggleSave(prevView => !prevView)}} >Done</div>
                            )}
                            { save && (
                                <form class="next" onsubmit={(event) => {drawHandler(table, data); event.preventDefault()}}>
                                    { addName }
                                    <input type="text" id="name" class="input"  value={data.name} onChange={(e)=>handleChange(e)} required/>
                                    <br/>
                                    { addRoutes }
                                    <br/>
                                    <input type="text" id="routes" class="input"  value={data.routes} onChange={(e)=>handleChange(e)} required/>
                                    <br/>
                                    <label for="email">If you would like to be notified when your stop is confirmed, please enter your email adress below.</label>
                                    <br/>
                                    <input type="email" id="email" class="input" value={data.email} onChange={(e)=>handleChange(e)}/>
                                    <br/>
                                    <input type="submit" value="Submit" id="save" class="button" style="margin-left: 0; padding:25px; padding-left:15px;">Save</input>                             
                                </form>
                            )}   
                            { cancel && (
                                <div class="button" onClick={() => handleCancel()}>Cancel</div>
                            )}
                        </div>                    
                    </div>
                    :
                    <div style="padding:20px" >Please switch to desktop in order to contribute with draw</div>
                }
            </div>

        )
    }

    const Contact = () => {
        return (
            <div>
                <form id="form-contact" method="POST" data-netlify="true" class="netlify-form">       
                    <h3>Get in touch</h3>
                    here or at rutemap@outlook.com to report problems or suggest new features. 
                    <br/>
                    <br/>
                    <input type="text" name="name" placeholder="Name" class="input"/> 
                    <br/>
                    <input type="text" name="email" placeholder="Email" class="input"/> 
                    <br/>
                    <textarea  type="text" name="message" id="message" rows="4" value={report} placeholder="Message" class="input"></textarea>
                    <br/>
                    <button type="submit" class="button">Send</button>
                </form>    
            </div>
        )
    }

    const Loading = () => {
        return <div class="loading" ><i class="fas fa-circle-notch fa-spin fa-2xl"></i></div>
    }

    let toberendered;

    if (component === '0') {
        toberendered = Loading()
    } else if (component === "1") {
        toberendered = RouteList
    } else if (component === "2") {
        toberendered = DrawContainer()
    } else if (component === "3") {
        toberendered = Contact()
    }

    function changeComponent(number) {
        document.getElementById(prevComponent).style.borderBottom = 'none';

        setComponent(number); 
        setPrevComponent(number)
        document.getElementById(number).style.borderBottom = '3px solid #040b21';
    }

    return (
        <div>
            <div id="container-background">
                <svg height="0">
                <mask id="mask-1">
                    <linearGradient id="gradient-1" y2="1.5">
                    <stop stop-color="white" offset="0.1"/>
                    <stop stop-opacity="0.1" offset="0.9"/>
                    </linearGradient>
                    <rect x="0.1" y="0.5" width="800" height="3500" fill="url(#gradient-1)"/>
                </mask>
                </svg>
            </div>
            <div id="container">
                { desktop.matches && (
                    <img alt='logo' src={rute} className='logo' />
                )}
                <div class="nav">
                    <button id="1"
                        class="navButton" 
                        onClick={() => changeComponent("1")}>routes</button>
                    <button id="2" 
                        class="navButton"
                        onClick={() => changeComponent("2")}>add</button>
                    <button id="3" 
                        class="navButton"
                        onClick={() => changeComponent("3")}>contact</button>
                </div>
                <div>{welcomeMessage}</div>
                <div>{toberendered}</div>
            </div>            
        </div>
    )
}
