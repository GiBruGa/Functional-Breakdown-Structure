// Fonctions partagees entre FBS.html et RFQ.html : constructeurs DOM generiques, aide-formulaire,
// modale, et affichage des badges/pastilles d'acronymes dans l'arborescence FBS.

// ===== Constructeurs DOM generiques =====

// Cree un element DOM avec attributs/style/texte en un appel. `props.style` est un objet
// (pas une chaine CSS) applique propriete par propriete ; class/onclick/title sont geres a part,
// le reste passe par setAttribute.
function makeEl(tag,props,text){
  var el=document.createElement(tag);
  if(props)Object.keys(props).forEach(function(k){
    if(k==="style"){Object.keys(props.style).forEach(function(sk){el.style[sk]=props.style[sk];});}
    else if(k==="class"){el.className=props[k];}
    else if(k==="onclick"){el.onclick=props[k];}
    else if(k==="title"){el.title=props[k];}
    else el.setAttribute(k,props[k]);
  });
  if(text!==undefined)el.textContent=text;
  return el;
}

// Ajoute plusieurs enfants (ignorant les falsy) a `parent` et le retourne, pour chainer les appels
// makeEl(...) sans variable intermediaire.
function app(parent){var args=Array.prototype.slice.call(arguments,1);args.forEach(function(c){if(c)parent.appendChild(c);});return parent;}

function makeInput(id,val,ph){return makeEl("input",{id:id,value:val||"",placeholder:ph||""});}
function makeTextarea(id,val,ph){var t=makeEl("textarea",{id:id,placeholder:ph||""});t.value=val||"";return t;}
function makeSelect(id,opts,val){
  var s=makeEl("select",{id:id});
  opts.forEach(function(o){var op=makeEl("option",{value:o.v},o.l);if(o.v===val)op.selected=true;s.appendChild(op);});
  return s;
}
// Enveloppe un champ de formulaire (avec label optionnel) dans une div ".ff full" (voir styles ff/ff-* de chaque app).
function makeFF(label,el){var w=makeEl("div",{"class":"ff full"});if(label)w.appendChild(makeEl("label",{},label));w.appendChild(el);return w;}

// Deep clone via JSON (suffisant : etat de l'app = donnees serialisables, pas de Date/fonction/cycle).
function clone(o){return JSON.parse(JSON.stringify(o));}

// ===== Modale generique =====
// Contrat DOM attendu dans la page hote : #mo (conteneur, classes "mo"/"mo open"),
// #modal (classes "modal"/"modal wide"), #modal-title, #modal-body, #modal-foot.
function showModal(title,bodyEl,footEl,wide){
  document.getElementById("modal-title").textContent=title;
  var mb=document.getElementById("modal-body");mb.innerHTML="";if(bodyEl)mb.appendChild(bodyEl);
  var mf=document.getElementById("modal-foot");mf.innerHTML="";
  if(Array.isArray(footEl))footEl.forEach(function(el){if(el)mf.appendChild(el);});
  else if(footEl)mf.appendChild(footEl);
  document.getElementById("modal").className="modal"+(wide?" wide":"");
  document.getElementById("mo").className="mo open";
}
function closeModal(){document.getElementById("mo").className="mo";}

// ===== Badges/pastilles d'acronymes dans l'arborescence FBS =====
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
