<template>
  <div class="pokedex">
    <div class="top-section">
      <div class="title-screen">
        <h1>Pokédex</h1>
      </div>
    </div>
    <div class="screen-section">
      <div class="screen">
        <div class="buscador">
          <input v-model="num" type="text" placeholder="Número de Pokémon" class="input"/>
          <button @click="listarPokemones()" class="btn">Buscar</button>
        </div>
        <div class="info">
          <h2>{{ nombre }} {{ nmr }}</h2>
          <img :src="image" alt="Imagen del Pokémon" v-if="image" class="pokemon-img" :style="{ background: type2 ? 'linear-gradient(135deg, ' + getTypeColor(type1) + ', ' + getTypeColor(type2) + ')' : getTypeColor(type1) }"/>
        </div>
        <div class="details">
          <div v-if="nombre" class="exp">
            <h3>{{ peso }}</h3>
            <h3>{{ altura }}</h3>
          </div>
          <div class="type">
            <img v-if="type1" :src="getTypeSprite(type1)" alt="Tipo 1" class="type-img">
            <img v-if="type2" :src="getTypeSprite(type2)" alt="Tipo 2" class="type-img">
          </div>
          <div v-if="weaknesses && weaknesses.length > 0" class="debi">
            <h3>Debilidades:</h3> 
          </div>
          <div v-if="weaknesses && weaknesses.length > 0" class="weaknesses">
              <img v-for="(weakness, index) in weaknesses" :key="index" :src="getTypeSprite(weakness)" :alt="`Debilidad ${weakness}`" class="weakness-img">
          </div>
        </div>
          <div v-if="stats.length > 0" class="stats-container">
            <div v-for="(stat, index) in stats" :key="index" class="stat-row">
              <div class="stat-label">{{ stat.name }}</div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: Math.min((stat.base_stat / 255)* 100,100) + '%' }"
                ></div>
                <div class="stat-value">{{ stat.base_stat }} / 225</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-section">
      <div class="buttons">
        <div class="circle-button"></div>
        <div class="small-buttons">
          <div class="small-button red"></div>
          <div class="small-button blue"></div>
        </div>
      </div>
    </div>
    </div>
</template>

<script setup>
import axios from "axios";
import { ref } from "vue";

let nombre = ref("");
let peso = ref("");
let altura = ref("");
let image = ref("");
let num = ref("");
let stats = ref([]);
let weaknesses = ref([]);
let searched = ref(false);
let type1 = ref("");
let type2 = ref("");
let nmr = ref("");

async function listarPokemones() {
  if (num.value) {
    let url = `https://pokeapi.co/api/v2/pokemon/${num.value}`;
    try {
      let { data } = await axios.get(url);
      nombre.value = capitalizeFirstLetter(data.name);
      nmr.value = `#${data.id}`
      peso.value = "Peso: "+data.weight / 10+"Kg";
      altura.value = "Altura: "+data.height / 10+"M";
      image.value = data.sprites.other['official-artwork'].front_default;
      type1.value = data.types[0]?.type.name || '';
      type2.value = data.types[1]?.type.name || '';
      stats.value = data.stats.map((stat) => ({
        name: convertStatName(stat.stat.name),
        base_stat: stat.base_stat,
      }));
      await getWeaknesses(type1.value, type2.value);
    } catch (error) {
      console.error("Error al obtener los datos", error);
      nombre.value = "No encontrado";
      peso.value = "No encontrado";
      altura.value = "No encontrado";
      image.value = "";
      stats.value = [];
    } finally {
      searched.value = true;
    }
  }
}
async function getWeaknesses(type1, type2) {
  let url1 = `https://pokeapi.co/api/v2/type/${type1}`;
  let url2 = type2 ? `https://pokeapi.co/api/v2/type/${type2}` : null;
  let weaknessesSet = new Set();

  try {
    // Obtener debilidades del primer tipo
    let { data: typeData1 } = await axios.get(url1);
    let weaknesses1 = typeData1.damage_relations.double_damage_from.map(damage => damage.name);
    weaknesses1.forEach(w => weaknessesSet.add(w));

    // Obtener debilidades del segundo tipo (si existe)
    if (url2) {
      let { data: typeData2 } = await axios.get(url2);
      let weaknesses2 = typeData2.damage_relations.double_damage_from.map(damage => damage.name);
      weaknesses2.forEach(w => weaknessesSet.add(w));
    }

    // Filtra debilidades para mostrar solo las de doble daño
    weaknesses.value = Array.from(weaknessesSet);

  } catch (error) {
    console.error("Error al obtener las debilidades", error);
    weaknesses.value = [];
  }
}

function convertStatName(statName) {
  switch (statName) {
    case "hp":
      return "HP";
    case "attack":
      return "Ataque";
    case "defense":
      return "Defensa";
    case "special-attack":
      return "Ataque Especial";
    case "special-defense":
      return "Defensa Especial";
    case "speed":
      return "Velocidad";
    default:
      return statName;
  }
}

function getTypeSprite(type) {
  const typeSprites = {
    normal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/1.png',
    fighting: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/2.png',
    flying: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/3.png',
    poison: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/4.png',
    ground: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/5.png',
    rock: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/6.png',
    bug: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/7.png',
    ghost: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/8.png',
    steel: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/9.png',
    fire: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/10.png',
    water: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/11.png',
    grass: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/12.png',
    electric: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/13.png',
    psychic: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/14.png',
    ice: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/15.png',
    dragon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/16.png',
    dark: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/17.png',
    fairy: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/18.png',
  };

  return typeSprites[type] || 'assets/types/default.png'; // default.png por si no se encuentra el tipo
}

function getTypeColor(type) {
  const typeColors = {
    normal: '#A8A77A',
    fighting: '#C22E28',
    flying: '#A98FF3',
    poison: '#A33EA1',
    ground: '#E2BF65',
    rock: '#B6A136',
    bug: '#A6B91A',
    ghost: '#735797',
    steel: '#B7B7CE',
    fire: '#EE8130',
    water: '#6390F0',
    grass: '#7AC74C',
    electric: '#F7D02C',
    psychic: '#F95587',
    ice: '#96D9D6',
    dragon: '#6F35FC',
    dark: '#705746',
    fairy: '#D685AD',
  };

  return typeColors[type] || '#777'; // Un color por defecto si el tipo no se encuentra
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
</script>

<style>
.debi{
  color: #334f5e;
  margin-top: -4%;
}

.weaknesses{
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weaknesses img{
  width: 100%;
}

h2 {
  color: #334f5e;
  margin: 0px;
}

.type {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.type img{
  width: 100%;
}

.exp {
  color: #334f5e;
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 200px;
  text-align: center;
  margin-bottom: 10px;
}

.details {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

h3{
  margin-top:35px;
  margin-bottom: 0;
}

.pokedex {
  width: 35%;
  background-color: #8d000c;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.title-screen {
  margin-bottom: 2px;
  background-color: black;
  align-items: center;
  padding: 5px;
  border-radius: 5px;
}

.title-screen h1 {
  color: white;
  font-size: 24px;
}
.screen-section{
  height: 100%;
}
.screen {
  background-color: #f0f0f0;
  padding: 15px;
  border-radius: 5px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  display: flex;  
  flex-direction: column;
}
.buscador{
  height: 65px;
  gap: 0.5%;
  align-items: center;
  justify-content: center;
}
.input {
  width: 70%;
  padding: 5px;
  border-radius: 5px;
  border: 2px solid #c62828;
}

.btn {
  background-color: #0288d1;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  padding: 2.7px;
  margin-left: 1%;
  border: 2px solid #0288d1;
}
.info{
  margin-bottom: -30px;
}
.info img{
  width: 45%;
  height: auto;
}
.pokemon-img {
  width: 250px;
  height: 250px;
}
.stats-container{
  width: 78%;
  display: flex;
  flex-direction: column;
  align-self: center;
}
.stat-row {
  margin-bottom: 10px;
}

.stat-label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #334f5e;
}

.progress-bar {
  position: relative;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #a64ca6;
  transition: width 0.5s ease;
}

.stat-value {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  color: black;
}

.bottom-section .buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circle-button {
  width: 40px;
  height: 40px;
  background-color: black;
  border-radius: 50%;
  margin-top: 15px;
}
@media (min-width:1200px){
  .pokedex{
    width: 40%;
  }
}
@media (max-width:1000px){
  .pokedex{
    width: 50%;
  }
}
@media (max-width:900px){
  .pokedex{
    width: 60%;
  }
}
@media (max-width:800px){
  .pokedex{
    width: 70%;
  }
}
@media (max-width:700px){
  .pokedex{
    width: 80%;
  }
}
@media (max-width:600px){
  .pokedex{
    width: 90%;
  }
}
</style>