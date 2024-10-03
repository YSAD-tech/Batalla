<template>
  <div class="menu-container" v-if="!isBattleStarted">
    <h2>Bienvenido al simulador de batalla Pokémon</h2>
    
    <!-- Seleccionar número de rondas -->
    <label for="rounds">Número de rondas:</label>
    <input id="rounds" type="number" v-model="selectedRounds" placeholder="Ingresa el número de rondas" min="1" />

    <!-- Seleccionar tipo de stat para la batalla -->
    <label for="stat">Selecciona el stat para la batalla:</label>
    <select id="stat" v-model="selectedStat">
      <option value="attack">Ataque</option>
      <option value="defense">Defensa</option>
      <option value="speed">Velocidad</option>
      <option value="special-attack">Ataque Especial</option>
      <option value="special-defense">Defensa Especial</option>
    </select>

    <button @click="startBattle">Iniciar Batalla</button>
  </div>

  <div class="battle-container" v-else>
    <h2>Batalla Pokémon (Ronda {{ currentRound }} de {{ totalRounds }})</h2>

    <div class="pokemon-wrapper">
      <!-- Información del Pokémon 1 -->
      <div class="pokemon-side">
        <div v-if="pokemon1.data">
          <h3>{{ capitalizeFirstLetter(pokemon1.data.name) }}</h3>
          <img :src="pokemon1.data.sprites.other['official-artwork'].front_default" alt="Imagen de {{ pokemon1.data.name }}" />
          <p>HP: {{ pokemon1.hp }}</p>
          <p>{{ capitalizeFirstLetter(selectedStat) }}: {{ pokemon1[selectedStat] }}</p>
        </div>
        <div v-else>
          <p>Cargando Pokémon 1...</p>
        </div>
      </div>

      <!-- Información del Pokémon 2 -->
      <div class="pokemon-side">
        <div v-if="pokemon2.data">
          <h3>{{ capitalizeFirstLetter(pokemon2.data.name) }}</h3>
          <img :src="pokemon2.data.sprites.other['official-artwork'].front_default" alt="Imagen de {{ pokemon2.data.name }}" />
          <p>HP: {{ pokemon2.hp }}</p>
          <p>{{ capitalizeFirstLetter(selectedStat) }}: {{ pokemon2[selectedStat] }}</p>
        </div>
        <div v-else>
          <p>Cargando Pokémon 2...</p>
        </div>
      </div>
    </div>

    <!-- Botones de ataque -->
    <div class="attack-buttons" v-if="pokemon1.data && pokemon2.data && pokemon1.hp > 0 && pokemon2.hp > 0 && currentRound <= totalRounds">
      <button @click="attack(pokemon1, pokemon2)">¡{{ capitalizeFirstLetter(pokemon1.data.name) }} ataca con {{ capitalizeFirstLetter(selectedStat) }}!</button>
      <button @click="attack(pokemon2, pokemon1)">¡{{ capitalizeFirstLetter(pokemon2.data.name) }} ataca con {{ capitalizeFirstLetter(selectedStat) }}!</button>
    </div>

    <!-- Mostrar el ganador -->
    <div v-else-if="winner">
      <h2>{{ capitalizeFirstLetter(winner) }} es el ganador después de {{ totalRounds }} rondas!</h2>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// Función para obtener datos del Pokémon desde PokeAPI
const getPokemonData = async (pokemonId) => {
  const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
  return response.data
}

// Función para obtener un ID de Pokémon aleatorio entre 1 y 1010
const getRandomPokemonId = () => Math.floor(Math.random() * 1010) + 1

// Variables reactivas para los Pokémon
const pokemon1 = ref({
  id: getRandomPokemonId(),
  data: null,
  hp: 100
})

const pokemon2 = ref({
  id: getRandomPokemonId(),
  data: null,
  hp: 100
})

// Variables reactivas para controlar el estado del juego
const isBattleStarted = ref(false)
const totalRounds = ref(0)
const currentRound = ref(1)

// Variables para seleccionar número de rondas y tipo de stat
const selectedRounds = ref(3)
const selectedStat = ref('attack')

// Función para comenzar la batalla
const startBattle = async () => {
  totalRounds.value = selectedRounds.value
  isBattleStarted.value = true

  // Obtener datos de Pokémon 1
  pokemon1.value.data = await getPokemonData(pokemon1.value.id)
  pokemon1.value.hp = pokemon1.value.data.stats.find(stat => stat.stat.name === 'hp').base_stat
  pokemon1.value[selectedStat.value] = pokemon1.value.data.stats.find(stat => stat.stat.name === selectedStat.value).base_stat

  // Obtener datos de Pokémon 2
  pokemon2.value.data = await getPokemonData(pokemon2.value.id)
  pokemon2.value.hp = pokemon2.value.data.stats.find(stat => stat.stat.name === 'hp').base_stat
  pokemon2.value[selectedStat.value] = pokemon2.value.data.stats.find(stat => stat.stat.name === selectedStat.value).base_stat
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Función de ataque basada en el stat seleccionado
const attack = (attacker, defender) => {
  defender.hp -= attacker[selectedStat.value]
  if (defender.hp < 0) defender.hp = 0
  currentRound.value++
}

// Computar el ganador
const winner = computed(() => {
  if (pokemon1.value.hp <= 0) {
    return pokemon2.value.data ? pokemon2.value.data.name : 'Desconocido'
  } else if (pokemon2.value.hp <= 0) {
    return pokemon1.value.data ? pokemon1.value.data.name : 'Desconocido'
  } else if (currentRound.value > totalRounds.value) {
    return pokemon1.value.hp > pokemon2.value.hp
      ? pokemon1.value.data.name
      : pokemon2.value.data.name
  }
  return null
})
</script>

<style scoped>
.menu-container {
  text-align: center;
  margin-top: 50px;
}

.menu-container label {
  margin-right: 10px;
}

.menu-container select, 
.menu-container input {
  margin-bottom: 20px;
}

.menu-container button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.menu-container button:hover {
  background-color: #45a049;
}

.battle-container {
  text-align: center;
  padding: 20px;
}

.pokemon-wrapper {
  display: flex;
  justify-content: space-between;
  padding: 20px;
}

.pokemon-side {
  width: 45%;
  text-align: center;
}

img {
  width: 150px;
  height: 150px;
}

.attack-buttons {
  margin-top: 20px;
}

button {
  margin: 10px;
  padding: 10px;
  background-color: #f0ad4e;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #ec971f;
}
</style>