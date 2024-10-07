<template>
  <div class="menu-container" v-if="!isBattleStarted">
    <h2>Bienvenido al simulador de batalla Pokémon</h2>
    
    <!-- Seleccionar número de rondas -->
    <div class="input-group">
      <label for="rounds">Número de rondas:</label>
      <input id="rounds" type="number" v-model="selectedRounds" placeholder="Ingresa el número de rondas" min="1" />
    </div>

    <!-- Seleccionar tipo de stat para la batalla -->
    <div class="input-group">
      <label for="stat">Selecciona el stat para la batalla:</label>
      <select id="stat" v-model="selectedStat">
        <option value="attack">Ataque</option>
        <option value="defense">Defensa</option>
        <option value="speed">Velocidad</option>
        <option value="special-attack">Ataque Especial</option>
        <option value="special-defense">Defensa Especial</option>
      </select>
    </div>

    <button @click="startBattle">Fight</button>
  </div>

  <div class="battle-container" v-else>
    <h2>Batalla Pokémon (Ronda {{ currentRound }} de {{ totalRounds }})</h2>

    <div class="pokemon-wrapper">
      <!-- Información del equipo 1 -->
      <div class="pokemon-side">
        <h3>Equipo 1</h3>
        <div class="pokemon-grid">
          <div v-for="pokemon in team1" :key="pokemon.id" 
               class="pokemon-card" 
               :class="{ selected: selectedPokemon1.id === pokemon.id }"
               @click="selectPokemon1(pokemon)">
            <h4>{{ capitalizeFirstLetter(pokemon.data.name) }}</h4>
            <img :src="pokemon.data.sprites.other['official-artwork'].front_default" alt="Imagen de {{ pokemon.data.name }}" />
            <p>HP: {{ pokemon.hp }}</p>
            <p>{{ capitalizeFirstLetter(selectedStat) }}: {{ pokemon.attack }}</p>
          </div>
        </div>
      </div>

      <!-- Información del equipo 2 -->
      <div class="pokemon-side">
        <h3>Equipo 2</h3>
        <div class="pokemon-grid">
          <div v-for="pokemon in team2" :key="pokemon.id" class="pokemon-card">
            <h4>{{ capitalizeFirstLetter(pokemon.data.name) }}</h4>
            <img :src="pokemon.data.sprites.other['official-artwork'].front_default" alt="Imagen de {{ pokemon.data.name }}" />
            <p>HP: {{ pokemon.hp }}</p>
            <p>{{ capitalizeFirstLetter(selectedStat) }}: {{ pokemon.attack }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de ataque -->
    <div class="attack-buttons" v-if="canAttack">
      <button @click="attack(selectedPokemon1, randomPokemonFromTeam2())">¡{{ capitalizeFirstLetter(selectedPokemon1.data.name) }} ataca!</button>
    </div>

    <!-- Mostrar el ganador -->
    <div v-else-if="winner">
      <h2>{{ capitalizeFirstLetter(winner) }} es el ganador después de {{ totalRounds }} rondas!</h2>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

// Función para obtener datos del Pokémon desde PokeAPI
const getPokemonData = async (pokemonId) => {
  const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
  return response.data
}

// Función para obtener un ID de Pokémon aleatorio entre 1 y 1010
const getRandomPokemonId = () => Math.floor(Math.random() * 1010) + 1

// Variables reactivas para los Pokémon
const team1 = ref([]);
const team2 = ref([]);
const selectedPokemon1 = ref({});

// Variables reactivas para controlar el estado del juego
const isBattleStarted = ref(false)
const totalRounds = ref(0)
const currentRound = ref(1)

// Variables para seleccionar número de rondas y tipo de stat
const selectedRounds = ref(3)
const selectedStat = ref('attack')

// Inicializar los equipos
const initializeTeams = async () => {
  for (let i = 0; i < 5; i++) {
    const pokemonId1 = getRandomPokemonId();
    const pokemonId2 = getRandomPokemonId();
    
    const data1 = await getPokemonData(pokemonId1);
    const data2 = await getPokemonData(pokemonId2);
    
    team1.value.push({
      id: pokemonId1,
      data: data1,
      hp: data1.stats.find(stat => stat.stat.name === 'hp').base_stat,
      attack: data1.stats.find(stat => stat.stat.name === selectedStat.value).base_stat
    });
    
    team2.value.push({
      id: pokemonId2,
      data: data2,
      hp: data2.stats.find(stat => stat.stat.name === 'hp').base_stat,
      attack: data2.stats.find(stat => stat.stat.name === selectedStat.value).base_stat
    });
  }
};

// Función para comenzar la batalla
const startBattle = async () => {
  totalRounds.value = selectedRounds.value;
  isBattleStarted.value = true;
  await initializeTeams();
}

const selectPokemon1 = (pokemon) => {
  selectedPokemon1.value = pokemon;
};

const randomPokemonFromTeam2 = () => {
  const alivePokemons = team2.value.filter(p => p.hp > 0);
  return alivePokemons[Math.floor(Math.random() * alivePokemons.length)];
};

// Función de ataque basada en el stat seleccionado
const attack = (attacker, defender) => {
  defender.hp -= attacker.attack;
  if (defender.hp < 0) defender.hp = 0;

  // Verificar si un equipo ha sido derrotado
  const team1Alive = team1.value.some(p => p.hp > 0);
  const team2Alive = team2.value.some(p => p.hp > 0);

  if (!team1Alive || !team2Alive) {
    currentRound.value++;
  }
};

// Comprobar el ganador
const winner = computed(() => {
  const team1Alive = team1.value.some(p => p.hp > 0);
  const team2Alive = team2.value.some(p => p.hp > 0);

  if (!team1Alive) return "Equipo 2";
  if (!team2Alive) return "Equipo 1";
  return null;
});

const canAttack = computed(() => {
  return selectedPokemon1.value.id && team2.value.some(p => p.hp > 0);
});

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
</script>

<style scoped>
.menu-container {
  text-align: center;
  margin-top: 50px;
  padding: 20px;
  border: 2px solid #4CAF50;
  border-radius: 10px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.menu-container h2 {
  color: #4CAF50;
  margin-bottom: 20px;
}

.menu-container label {
  margin-right: 10px;
  font-weight: bold;
}

.menu-container select, 
.menu-container input {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 200px;
}

.menu-container button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.menu-container button:hover {
  background-color: #45a049;
}

.battle-container {
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9; /* Fondo claro para el contenedor */
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.pokemon-wrapper {
  display: flex;
  justify-content: space-between; /* Espacio entre equipos */
  padding: 20px;
}

.pokemon-side {
  width: 45%;
  text-align: center;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Tres columnas en la parte superior */
  gap: 10px; /* Espacio entre tarjetas */
}

.pokemon-card {
  background-color: #e0f7fa; /* Color de fondo para cada Pokémon */
  border: 1px solid #4CAF50; /* Bordes para separar Pokémon */
  border-radius: 10px;
  padding: 10px;
  cursor: pointer; /* Cambiar cursor al pasar sobre la tarjeta */
  transition: transform 0.2s; /* Efecto de transformación */
}

.pokemon-card:hover {
  transform: scale(1.05); /* Efecto de ampliación al pasar el mouse */
}

.selected {
  border-color: #f44336; /* Color de borde para Pokémon seleccionado */
}

img {
  width: 100%; /* Ajustar al 100% del contenedor */
  height: auto; /* Mantener proporciones */
}

.attack-buttons {
  margin-top: 20px;
}

.attack-buttons button {
  margin: 10px;
  padding: 10px;
  background-color: #f0ad4e;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.attack-buttons button:hover {
  background-color: #ec971f; /* Cambio de color en hover */
}
</style>