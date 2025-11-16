import movies from '../data/movies.json';


export default function MovieList() {
    return (
        
        $(movies).ready(function(){
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(){
                if(xhr.readyState == 4 && xhr.status == 200){
                    xmlDoc = xhr.responseXML;
                    let films = xmlDoc.getElementbyTagNAme('movies');
                    let html = "";
                    for (let i = 0; i < films.length; i++){
                        html += xmlDoc.getElementsByTagName('title')[i].childNodes[0].nodeValue + "<br>";
                        + xmlDoc.getElementsByTagName('director')[i].childNodes[0].nodeValue + "<br>";
                        + xmlDoc.getElementsByTagName('year')[i].childNodes[0].nodeValue + "<br><br>";
                    }
                    document.getElementById("movieList").innerHTML = html;
                }
            }
            xhr.open("GET", "movies.xml", true);
            xhr.send();
        })
        
        <div> 
            
            
            
        </div>
    );
}