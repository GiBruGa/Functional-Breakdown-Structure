// Fonctions partagees entre FBS.html et RFQ.html pour l'affichage des badges/pastilles d'acronymes dans l'arborescence FBS.
function buildAcrMap(){var m={};state.acronymes.forEach(function(a){m[a.id]=a;});return m;}

// Source d'icone d'un acronyme : SVG (identite visuelle centralisee) prioritaire sur l'ancien PNG,
// null si aucun des deux. A utiliser partout plutot que de reconstruire le data URI a la main.
function acrIconSrc(a){
  if(!a) return null;
  if(a.iconSvg) return "data:image/svg+xml;utf8,"+encodeURIComponent(a.iconSvg);
  if(a.iconBase64) return "data:image/png;base64,"+a.iconBase64;
  return null;
}

// Badge acronyme : icone base64 si disponible, sinon badge colore
// Pas de separateur entre badges -- si vide, rien n affiche
function makeBadgeEl(id, acrMap){
  var a = acrMap[id] || {};
  var color = a.couleur || "#555";
  var el = document.createElement("span");
  el.title = a.designation || id;

  if (a.iconBase64) {
    // Mode icone
    el.className = "acr-icon";
    var img = document.createElement("img");
    img.src = "data:image/png;base64," + a.iconBase64;
    img.style.width = "14px";
    img.style.height = "14px";
    img.style.objectFit = "contain";
    el.appendChild(img);
  } else {
    // Mode badge colore
    el.className = "acr-badge";
    el.textContent = id;
    el.style.background = color + "33";
    el.style.color = color;
    el.style.borderColor = color + "88";
    if (a.ordre === 1 && a.categorie === "Besoin_Client") {
      el.style.background = color + "66";
      el.style.fontWeight = "bold";
    }
    if (a.ordre <= 2 && a.categorie === "Risque_Type" && id !== "·") {
      el.style.background = color + "55";
      el.style.fontWeight = "bold";
    }
  }
  return el;
}

// Ligne de badges sans separateur -- si champ vide, rien
function makePillsEl(node, acrMap){
  var wrap = document.createElement("div");
  wrap.className = "nmeta";
  if (node.application && node.application !== "." && node.application !== "")
    wrap.appendChild(makeBadgeEl(node.application, acrMap));
  if (node.besoin && node.besoin !== "." && node.besoin !== "")
    wrap.appendChild(makeBadgeEl(node.besoin, acrMap));
  if (node.risque && node.risque !== "." && node.risque !== "")
    wrap.appendChild(makeBadgeEl(node.risque, acrMap));
  if (node.phase && node.phase !== "0" && node.phase !== "")
    wrap.appendChild(makeBadgeEl(node.phase, acrMap));
  return wrap;
}
