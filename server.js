const http = require("http");
const url = require("url");
const fs = require("fs");
const { parse } = require('path');


const server = http.createServer((req, res) => {

    let urlParse = url.parse(req.url, true);

    let contentRes = "";
    let statusCode = 500;
    let head = { "Content-Type": "text/html; charset=utf-8" };

    // Lecture du fichier
    fs.readFile("./content/datas.json", (errorFile, datas) => {
        if (errorFile) {
            console.log(errorFile);

            contentRes = "<h1>Erreur du serveur</h1>"
                + "<h2>Le fichier \"data.json\" est en erreur</h2>";

            res.writeHead(500, head);
            res.write(contentRes);
            res.end();

            return;  // Met fin au traitement
        }

        // Conversion des données JSON en JS
        datas = JSON.parse(datas.toString());

        // Traitement de la requete 
        console.log(urlParse);
        if (req.method == "GET") {
            if (urlParse.pathname == "/" || urlParse.pathname == "/accueil") {
                statusCode = 200;
                contentRes = `<h1>Page d'accueil</h1>
            <a href='/categs'>Vers les catégories principales</a>`;

                res.writeHead(statusCode, head);
                res.write(contentRes);
                res.end();
            }
            else if (urlParse.pathname == "/contact") {
                statusCode = 200;
                contentRes = `<h1>Page de contact en mode GET</h1>
                <input type="text" name="name"><br>
                <input type="text" name="lastname">
                <button type="submit">Envoyer</button>`;

                res.writeHead(statusCode, head);
                res.write(contentRes);
                res.end();
            }
            else if (urlParse.pathname.includes("/categs")) {
                //Exemple d'ecriture d'une regex en JS
                const demoRegex = /test/;

                let error404 = null;

                // Categs : 	/categs
                if (urlParse.pathname === "/categs") {
                    statusCode = 200;

                    contentRes = `<h1>Vous êtes sur les catégories principales</h1>
                    <ul>`;

                    // On parcours les catégories principal du fichier
                    datas.categs.forEach(itemCateg => {
                        contentRes += `<li><a href="/categs/${itemCateg.id}/subcategs">${itemCateg.name}</a></li>`;
                    });

                    contentRes += `</ul>`;

                    res.writeHead(statusCode, head);
                    res.write(contentRes);
                    res.end();
                }
                // Test si l'url commence par « /categs/??/subcategs/?? »
                else if (/^\/categs\/[1-9][0-9]*\/subcategs(\/[0-9]+)?/.test(urlParse.pathname)) {
                    // Découpage de l'url
                    const urlSplit = urlParse.pathname.split("/");
                    console.log(urlSplit);
                    // Exemple de valeur -> [ "", "categs", "42", "subcategs"]

                    // Récuperation de la categId (avec un parseInt)
                    const categId = parseInt(urlSplit[2]);

                    // Utilisation de la méthode "find" des array de JS
                    // Pour obtenir l'objet "categ" sur base de la valeur "categId"
                    // La condition est envoyé sous forme de Predicat : 
                    // -> Pour chaque categorie, je teste si l'id est egale au "categId"
                    const categ = datas.categs.find(c => c.id === categId);
                    console.log(categ);

                    if(categ !== undefined) {
                        // Récuperation de la subCategId (Optionnel !!!)
                        const subCategId = urlSplit[4] != undefined ? parseInt(urlSplit[4]) : null;
                        
                        // Sous-categs :	/categs/42/subcategs
                        if(subCategId === null) {
                            contentRes = `<h1>Categorie : ${categ.name}</h1>
                                          <h2>Veuillez selectionner une sous-categorie</h2>
                                          <ul>`;

                            categ.subcategs.forEach((subCateg) => {
                                contentRes += `<li>
                                                <a href="/categs/${categ.id}/subcategs/${subCateg.id}">
                                                    ${subCateg.name}
                                                </a>
                                               </li>`;
                            });
 
                            contentRes += "</ul>";

                            res.writeHead(statusCode, head);
                            res.write(contentRes);
                            res.end();
                        }
                        else {
                            // Detail Sub 2 :	/categs/42/subcategs/2
                            // products : 	    /categs/42/subcategs/2/products
                            // product 13 :	    /categs/42/subcategs/2/products?prod=13

                            res.writeHead(statusCode, head);
                            res.write("CategID -> " + categId );
                            res.end();
                        }
                    }
                    else {
                        error404 = ":( Categorie non disponible";
                    }
                }
                else {
                    error404 = "Page invalide";
                }


                // En cas d'erreur => Affichage de la page
                if(error404) {
                    res.writeHead(404, head);
                    res.write(error404 + " -> " + urlParse.pathname);
                    res.end();
                }
            }
        }
        else if (req.method == "POST") {
            if (urlParse.pathname == "/contact") {
                let body = "";

                req.on('data', (form) => {
                    body += form.toString();
                });

                req.on('end', () => {

                    //ici je suis dans la possibilité de recevoir de mon body (formulaire)
                    // "name=loic&lastname=baudoux"    ====> STRING que je peux parser avec le décodeur
                    // "{ 'name' : 'loic', 'lastname' : 'baudoux'}"     =====> STRING que je peux parser avec JSON.parse()
                    if (body.startsWith("{") && body.endsWith("}"))
                        body = JSON.parse(body);
                    else {

                        /*
                        Convertit "name=loic&lastname=baudoux" en JSON { 'name' : 'loic', 'lastname' : 'baudoux' } utilisable
                        */
                        body = JSON.parse('{"' + decodeURI(body).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                    }

                    console.log(body);
                });


                //je traite le formulaire ici
                //et puis je redirige mon client vers autre part.
                statusCode = 303;
                head = { "Location": "/" };

                res.writeHead(statusCode, head);
                res.write(contentRes);
                res.end();


                // statusCode 302 -> redirection standard
                // 307 -> passer de get à post puis redirger vers le meme lien en post 
                // 303 -> passer de get à post puis redirger vers un autre lien en get 
            }
        }
        else {
            statusCode = 404;
            contentRes = `<h1>Je ne connais pas cette méthode HTTP : ${req.method}</h1>`;

            res.writeHead(statusCode, head);
            res.write(contentRes);
            res.end();
        }

    });
});

server.listen(process.env.PORT || 3000);