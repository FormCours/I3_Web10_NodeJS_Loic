const http = require("http");
const url = require("url");
const fs = require("fs");
const querystring = require('query-string');


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
                <a href='/categs'>Vers les catégories principales</a>
                <br/>
                <a href='/contact'>Vers la page contact</a>
                <br />
                <a href="/demo?name=Leila&lastname=Myar">
                    Demo GET -> /demo?name=Leila&lastname=Myar
                </a>`;

                res.writeHead(statusCode, head);
                res.write(contentRes);
                res.end();
            }
            else if (urlParse.pathname == "/contact") {
                statusCode = 200;
                contentRes = `<h1>Page de contact</h1>
                <form method="POST">
                    <input type="text" name="name">
                    <br>
                    <input type="text" name="lastname">
                    <br>
                    <button type="submit">Envoyer</button>
                </form>`;

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

                    if (categ !== undefined) {
                        // Récuperation de la subCategId (Optionnel !!!)
                        const subCategId = urlSplit[4] != undefined ? parseInt(urlSplit[4]) : null;

                        // Sous-categs :	/categs/42/subcategs
                        if (subCategId === null) {
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
                            statusCode = 200;

                            res.writeHead(statusCode, head);
                            res.write(contentRes);
                            res.end();
                        }
                        else {
                            // Detail Sub 2 :	/categs/42/subcategs/2
                            const subCateg = categ.subcategs.find(sc => sc.id === subCategId);

                            if (subCateg != undefined) {
                                contentRes = `<h1>Categorie principal : ${categ.name}</h1>
                                              <h2>Categorie secondaire : ${subCateg.name}</h2>
                                              <br/>
                                              <h3>Liste des produits</h3>
                                              <ul>`;

                                subCateg.products.forEach(product => {
                                    contentRes += `<li>
                                                    ${product.name} ${product.price} €
                                                  </li>`;
                                });

                                contentRes += '</ul>';
                                statusCode = 200;

                                res.writeHead(statusCode, head);
                                res.write(contentRes);
                                res.end();
                            }
                            else {
                                error404 = "Sous categorie inconnue";
                            }
                        }

                        // TODO : A faire par la suite ;)
                        // product 13 :	    /categs/42/subcategs/2/products?prod=13
                    }
                    else {
                        error404 = ":( Categorie non disponible";
                    }
                }
                else {
                    error404 = "Page invalide";
                }


                // En cas d'erreur => Affichage de la page
                if (error404) {
                    res.writeHead(404, head);
                    res.write(error404 + " -> " + urlParse.pathname);
                    res.end();
                }
            }
            
            else {
                res.writeHead(404, head);
                res.write('<h1>Vous etes perdu ? :o </h1>');
                res.end();
            }
        }
        else if (req.method == "POST") {
            if (urlParse.pathname == "/contact") {

                // Event "data" de la requete : Lecture des données POST de la requete
                let body = "";
                req.on('data', (form) => {
                    console.log(form);
                    body += form.toString();
                });
                // Le contenu du "form" est au format hexadecimal (dans un buffer)
                // => 6e 61 6d 65 3d 5a 61 7a 61 26 6c 61 73 74 6e 61 6d 65 3d 56 61 6e 64 65 72 71 75 61 63 6b
                // Aprés convertion via la méthode "toString", cela donne : 
                // => name=Zaza&lastname=Vanderquack


                // Event "end" : Se déclanche après que les données ont été traité (cf: event "data")
                req.on('end', () => {
                    // Les données recu on été stocké dans la variable "body"
                    console.log(body);

                    let result;
                    // Test pour savoir si les données ont de type : 
                    //  - object json
                    //  - x-www-form-urlencoded

                    if (body.startsWith("{") && body.endsWith("}")){
                        // Traitement si les données sont au format Json
                        result = JSON.parse(body);
                     }
                    else {
                        // Traitement si les donénes sont au format x-www-form-urlencoded
                        // body -> name=Zaza&lastname=Vanderquack
                        
                        // Conversion des données en format objet JS
                        result = querystring.parse(body);
                        // result -> { lastname: 'Vanderquack', name: 'Zaza' }
                    }
                    console.log(result);


                    // Utilisation des données dans la page de réponse
                    statusCode = 200;
                    contentRes = `
                        <h1>Page de contact - Réponse</h1>
                        <h2>Bienvenue ${result.name} ${result.lastname}</h2>
                        <a href="/">Retourner à la page Home</a>
                    `;

                    res.writeHead(statusCode, head);
                    res.end(contentRes)
                });


                // Exemple de redirection ↓
                /*
                statusCode = 303;
                head = { "Location": "/" };

                res.writeHead(statusCode, head);
                res.write(contentRes);
                res.end();

                // statusCode 302 -> redirection standard
                // 307 -> passer de get à post puis redirger vers le meme lien en post 
                // 303 -> passer de get à post puis redirger vers un autre lien en get 
                */
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