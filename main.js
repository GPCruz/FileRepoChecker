//Utilizar variáveis de ambiente para proteger dados sensíveis
require('dotenv/config');

//Detecta o tipo de terminal utilizado. Usado para tratar diferenças de endereçamento de diretórios entre terminais
const isWsl = require('is-wsl');
const rootdir = (isWsl ? process.env.ROOT_DIR_UNIX : process.env.ROOT_DIR) + process.env.TARGET_PATH;

var fetch = require('node-fetch');
const fs = require('fs');

var imgrepo = process.env.IMG_REPO;

//Regex contendo os tipos de arquivo buscados
const pattern = '(.+\.((jpg)|(svg)|(png)|(pdf)))';

//Contadores para conferência ao final do processamento
let count_folders = 0;
let count_matching_files = 0;
let count_unmatching_files = 0;
let count_found = 0;
let count_missing = 0;

//Variáveis para armazenar os links encontrados e faltantes
let links = [];
let errorlinks = [];

//Imprime um relatório com informações sobre o que foi processado até o momento
function printRelatorio() {
    console.clear();
    console.log("Folders: " + count_folders);
    console.log("Matching Files: " + count_matching_files);
    console.log("Unmatching Files: " + count_unmatching_files);
    console.log("Found: " + count_found);
    console.log("Missing: " + count_missing);
    console.log("------------------------------------------------------");
    console.log("Valid Links: ");
    console.log(links);
    console.log("------------------------------------------------------");
    console.log("Invalid Links: ");
    console.log(errorlinks);
}

//------------------

async function search(targetdir, path) {
  path = path ? path : "";
  let dir = await fs.promises.opendir(targetdir);
  try {
    for await (const dirent of dir){
      if(dirent.isDirectory()){
        //Rotina recursiva para pastas encontradas no diretório atual
        count_folders++;
        search(targetdir +"/"+ dirent.name, path + "/" + dirent.name);
      }else{
        if(dirent.name.match(pattern)){
          //Rotina para arquivos dentro do padrão buscado
          count_matching_files++;
          // console.log(targetdir + "/" + dirent.name);
          // console.log(imgrepo + path + "/" + dirent.name);
          await fetch(imgrepo + path + "/" + dirent.name)
          .then(response => {
            if (response.status == 200) {
                count_found++; //Contagem de arquivos encontrados online
                links.push(imgrepo + path + "/" + dirent.name); //Listagem de arquivos encontrados online
            } else {
                count_missing++; //Contagem de arquivos indisponíveis online
                errorlinks.push(imgrepo + path + "/" + dirent.name); //Listagem de arquivos indisponíveis online
            }
          })
        }else{
          //Rotina para arquivos fora do padrão buscado
          count_unmatching_files++;
        }
      }
      printRelatorio();
    }
  } catch (err) {
    console.error(err);
  }
}

//Run
search(rootdir);