/*
 Ce script a pour but de détecter lorsque l'utilisateur
 a "upload" une image et s'assure que c'est bien une image.
 Il déclanche ensuite la prochaine phase.
*/
(async function(){

const model = await tf.loadModel('./model/model.json');
let liste_possibilites = ['Apple Braeburn', 'Apple Granny Smith', 'Apricot', 'Avocado', 'Banana', 'Cactus fruit', 'Cantaloupe 1', 'Cantaloupe 2', 'Carambula', 'Cherry 1', 'Cherry 2', 'Cherry Rainier', 'Cherry Wax Black', 'Cherry Wax Red', 'Cherry Wax Yellow', 'Clementine', 'Cocos', 'Dates', 'Granadilla', 'Huckleberry', 'Kiwi', 'Lemon', 'Limes', 'Lychee', 'Mandarine', 'Mango', 'Maracuja', 'Melon Piel de Sapo', 'Mulberry', 'Nectarine', 'Orange', 'Papaya', 'Passion Fruit', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Pomegranate', 'Raspberry', 'Strawberry', 'Tangelo', 'Walnut'];

let button_upload = document.getElementById("select_file");
let canvas = document.getElementsByTagName("canvas")[0];
let ctx = canvas.getContext("2d");
let display_img = document.getElementsByTagName("img")[0];
const CANVAS_SIZE = 100;


let division_right = document.getElementsByClassName("division_stats")[1];
let division_left = document.getElementsByClassName("division_stats")[0];

let stats_list = document.getElementsByTagName("li");
let bouton_retour = document.getElementsByTagName("button")[0];

button_upload.addEventListener("change",function(e){


	if(verifie_img()){ //C'est une image
		let real_path = window.URL.createObjectURL(e.target.files[0]);
		display_img.src = real_path;

		slide_left(true);

		draw_img();

		setTimeout(function(){
			//Traitement de l'image
			let rearranged_img = arrange_img();
			let tensor_predict = array_to_tensor(rearranged_img);

			let prediction = model_predict(tensor_predict);
			
			//La prédiction charge...
			prediction.then(function(result) {
				let highest_numbers = determine_highest(result);
				animation_result(highest_numbers);
				
			});

		},2000);

		
	}
	else{ //Fichier invalide
		console.log("oops");
	}

},false);


/* Partie vérification des données */



//Vérifie si c'est bien une image
function verifie_img(){
	let file_path = button_upload.value;
	let extension_regex = new RegExp("\.jpg|\.jpeg|\.png");

	return extension_regex.exec(file_path);
}


//Dessine l'image sur le canvas
function draw_img(){
	let file_reader = new FileReader();

    file_reader.onload = function(e) { /* Si les prédictions sont mauvaises, essayer de mettre l'image size à la size trained. */
       let img = new Image();
       img.src = e.target.result;

       img.onload = function() {
       	 canvas.width=CANVAS_SIZE;
    	 canvas.height=CANVAS_SIZE;
         ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
       };
    };

    file_reader.readAsDataURL( button_upload.files[0] );
}



/* Partie traitement des images pour le model */



//Prend l'image du canvas et enlève les A (rgba)
function arrange_img(){

	let data_img = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	let nb_pixel_color = (CANVAS_SIZE ** 2) * 4;
	//Step 1: Bouclez sur tout les pixels et construire un nouveau pixel en omettant les pixels opacity.
	let pixels_array = []; //Deviendra un array de taille CANVAS_SIZE * CANVAS_SIZE chaqu'un contenant un array de 3
	let section_array = []; //Contient une section complète puis l'envoye a pixels_array. 1 section = (r,g,b)
	let compteur_rgb = 0;

	for(i = 0;i < nb_pixel_color;i++)
	{
		if(i % 4 != 3){ //C'est un pixel r,g ou b
			compteur_rgb++;

			if(compteur_rgb == 3){//Fin de section
				section_array.push(data_img.data[i] / 255);
				pixels_array.push(section_array);
				section_array = [];
			}
			else{ //Continue/débute une section
				section_array.push(data_img.data[i] / 255);
			}
		}
		else{
			compteur_rgb = 0; //On remet le compteur r,g,b à 0
		}
	}

	return pixels_array
}

//Prend l'image arrangée et le reshape en un tensor de bonne taille pour la prédiction
function array_to_tensor(img_array){

	let reshaped_array = tf.tensor(img_array,[CANVAS_SIZE ** 2,3]);
	reshaped_array = tf.reshape(reshaped_array,[1,CANVAS_SIZE,CANVAS_SIZE,3]);

	return reshaped_array;
}

//Prend le tensor et prédit
function model_predict(tensor){

	let prediction = model.predict(tensor);
	prediction = prediction.data();

	return prediction;

}


//Détermine les 6 plus grands nombres de la prédictions et renvoi un array [valeur,index],...
function determine_highest(probabilities){

	let prob_array = Array.prototype.slice.call(probabilities); //Le convertit en array

	let array_prob = [];
	let small_array = [];

	for(i = 0;i < 6;i++)
	{
		let highest_number = Math.max(...prob_array);
		let position_highest = prob_array.indexOf(highest_number);

		small_array = [];
		small_array.push(highest_number * 100);
		small_array.push(position_highest);

		array_prob.push(small_array);
		prob_array[position_highest] = -1;
	}

	return array_prob;

}


/* Animations pour montrer les résultats */
function animation_result(stats){
	division_right.classList.add("appear");
	division_left.classList.add("to_left");

	//Fill le texte avec les stats
	for(i = 0;i < 6;i++)
	{
		let stats_name = stats_list[i].getElementsByTagName("span")[0];
		var stats_bar = stats_list[i].getElementsByTagName("span")[1];

		nom = liste_possibilites[stats[i][1]];
		valeur = stats[i][0];
		stats_name.innerHTML = nom + ":";
		stats_bar.innerHTML = valeur.toFixed(2) + "%";
		stats_bar.style.width = (valeur + 1 / 1.5) + "%";
		
	}

	bouton_retour.classList.add("show");
}


bouton_retour.addEventListener("click",function(){
	retour_menu();
},false);

//Fonction qui remet tout comme au début pour recommencer une nouvelle prédiction
function retour_menu(){
	division_right.classList.remove("appear");
	division_left.classList.remove("to_left");
	bouton_retour.classList.remove("show");

	slide_right(true);
}

})();

