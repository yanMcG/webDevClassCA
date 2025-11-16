import movies from '../data/movies.json';
import { useEffect } from 'react';

export default function MovieList() {
    useEffect(() => {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4 && xhr.status === 200){
                let xmlDoc = xhr.responseXML;
                let films = xmlDoc.getElementsByTagName('movies');
                let html = "";
                for (let i = 0; i < films.length; i++){
                    html += xmlDoc.getElementsByTagName('title')[i].childNodes[0].nodeValue + "<br>"
                        + xmlDoc.getElementsByTagName('director')[i].childNodes[0].nodeValue + "<br>"
                        + xmlDoc.getElementsByTagName('year')[i].childNodes[0].nodeValue + "<br><br>";
                }
                document.getElementById("movieList").innerHTML = html;
            }
        }
        xhr.open("GET", "movies.xml", true);
        xhr.send();
    }, []);


    function loadMoviesFromJSON() {
    fetch('/data/movies.json')
        .then(response =>{
            if(!response.ok){
                throw new Error("Network Error" + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            displayMovies(data);
        })
        .catch(error =>{
            console.error("Fetch error: ", error);
        })
    
    }


    function displayMovies(movies) {
        let list = document.createElement("ul");
        movies.forEach(movie => {
            let item = document.createElement("li");
            item.textContent = `${movie.title} directed by ${movie.director} (${movie.year})`;
            list.appendChild(item);
        });
        document.body.appendChild(list);
    }

    loadMoviesFromJSON();

    return (
        <div id="movieList"> 
            
        </div>
    );
}