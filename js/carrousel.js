var position_carrousel = -100;
var container_sous_section = document.getElementsByClassName("container_sous_section")[0];
var sous_section = document.getElementsByClassName("sous_section");
slide_left();

function slide_left(a) {
    position_carrousel += 100;
    if (position_carrousel > (sous_section.length - 1) * 100) {
        position_carrousel = 0
    }
    container_sous_section.style.right = position_carrousel + "%"
}

function slide_right(a) {
    position_carrousel -= 100;
    if (position_carrousel < 0) {
        position_carrousel = (sous_section.length - 1) * 100
    }
    container_sous_section.style.right = position_carrousel + "%"
}