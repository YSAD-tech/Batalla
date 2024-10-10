<template>
  <div class="contenedor" v-if="!isBattleStarted">
    <h2>Bienvenido al simulador de batalla Pokémon</h2>
    
    <!-- Campo de entrada para el nombre del jugador -->
    <div class="input-group">
      <label for="player-name">Nombre del jugador (Equipo 1):</label>
      <input id="player-name" type="text" v-model="playerName" placeholder="Ingresa tu nombre" />
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
        <h3>{{ playerName }} (Equipo 1)</h3>
        <div class="pokemon-grid">
          <div v-for="pokemon in team1" :key="pokemon.id" 
               class="pokemon-card" 
               :class="{ selected: selectedPokemon1.id === pokemon.id, inactive: pokemon.isDefeated }"
               @click="selectPokemon1(pokemon)" 
               :style="{ opacity: pokemon.isDefeated ? 0.5 : 1 }">
            <h3>{{ capitalizeFirstLetter(pokemon.data.name) }}</h3>
            <img :src="pokemon.data.sprites.other['official-artwork'].front_default" alt="Imagen de {{ pokemon.data.name }}" />
          </div>
        </div>
      </div>

      <!-- Información del equipo 2 -->
      <div class="pokemon-side">
        <h3>Bot (Equipo 2)</h3>
        <div class="pokemon-grid">
          <div v-for="pokemon in team2" :key="pokemon.id" 
               class="pokemon-card"
               :class="{ inactive: pokemon.isDefeated }"
               :style="{ opacity: pokemon.isDefeated ? 0.5 : 1 }">
            <h3>{{ capitalizeFirstLetter(pokemon.data.name) }}</h3>
            <img :src="pokemon.data.sprites.other['official-artwork'].front_default" alt="Imagen de {{ pokemon.data.name }}" />
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de ataque -->
    <div class="attack-buttons" v-if="canAttack">
      <button @click="attack(selectedPokemon1, selectedPokemon2)">¡{{ capitalizeFirstLetter(selectedPokemon1.data.name) }} ataca!</button>
    </div>

    <!-- Mostrar el ganador -->
    <div class="winner" v-else-if="winner">
      <h2>{{ winner }} es el ganador de la batalla!!</h2>
      <button @click="resetBattle" class="restart-button">Volver a Jugar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
// Función para obtener datos del Pokémon desde PokeAPI
const getPokemonData = async (pokemonId) => {
  const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
  return response.data
}

const resetBattle = () => {
  // Reiniciar solo las rondas y los equipos
  currentRound.value = 1;
  team1DefeatedCount.value = 0;
  team2DefeatedCount.value = 0;

  // Reiniciar los equipos
  initializeTeams(); // Inicializa los equipos nuevamente
  winner.value = null; // Reinicia el ganador
};

// Función para obtener un ID de Pokémon aleatorio entre 1 y 1025
const getRandomPokemonId = () => Math.floor(Math.random() * 1025) + 1

// Variables reactivas para los Pokémon
const team1 = ref([]);
const team2 = ref([]);
const selectedPokemon1 = ref({});
const selectedPokemon2 = ref({});

// Variables reactivas para controlar el estado del juego
const isBattleStarted = ref(false)
const totalRounds = ref(5) // Establecer siempre 5 rondas
const currentRound = ref(1)
const team1DefeatedCount = ref(0);
const team2DefeatedCount = ref(0);
const $q = useQuasar()

// Variables para seleccionar número de rondas y tipo de stat
const playerName = ref('');
const selectedStat = ref('attack')

// Inicializar los equipos con el número de Pokémon basado en la cantidad de rondas seleccionadas
const initializeTeams = async () => {
  team1.value = [];
  team2.value = [];

  for (let i = 0; i < 5; i++) {
    const pokemonId1 = getRandomPokemonId();
    const pokemonId2 = getRandomPokemonId();
    
    const data1 = await getPokemonData(pokemonId1);
    const data2 = await getPokemonData(pokemonId2);
    
    team1.value.push({
      id: pokemonId1,
      data: data1,
      isDefeated: false, // Indicador de si el Pokémon fue derrotado
      isSelected: false,  // Indicador de si el Pokémon fue seleccionado
    });
    
    team2.value.push({
      id: pokemonId2,
      data: data2,
      isDefeated: false // Indicador de si el Pokémon fue derrotado
    });
  }
};

// Función para obtener el valor del stat seleccionado dinámicamente
const getStatValue = (pokemon, statName) => {
  return pokemon.data.stats.find(stat => stat.stat.name === statName).base_stat;
};
// Función para comenzar la batalla
const startBattle = async () => {
  if (playerName.value.trim() === '') {
    $q.notify({
          message: 'Debes ingresar un nombre para el jugador.',
          color: 'purple',
          position: 'top'
        });
    return;
  }

  isBattleStarted.value = true;
  await initializeTeams();

  // Reiniciar la selección de Pokémon
  team1.value.forEach(pokemon => {
    pokemon.isSelected = false; // Reiniciar isSelected al comienzo de la batalla
  });
};

// Seleccionar Pokémon de equipo 1
const selectPokemon1 = (pokemon) => {
  if (!pokemon.isDefeated && !pokemon.isSelected) {
    selectedPokemon1.value = pokemon;
    pokemon.isSelected = true; // Marca el Pokémon como seleccionado
    selectedPokemon2.value = randomPokemonFromTeam2(); // Selecciona automáticamente un Pokémon aleatorio del equipo 2
  } else if (pokemon.isDefeated) {
    $q.notify({
          message: 'Este Pokémon está derrotado, elige otro.',
          color: 'purple',
          position: 'top'
        });
  } else {
    $q.notify({
          message: 'Este Pokémon ya ha sido seleccionado para atacar.',
          color: 'purple',
          position: 'top'
        });
  }
};


const randomPokemonFromTeam2 = () => {
  const alivePokemons = team2.value.filter(p => !p.isDefeated);
  return alivePokemons[Math.floor(Math.random() * alivePokemons.length)];
};

// Función de ataque que compara el valor del stat seleccionado para elegir al ganador
const attack = (pokemon1, pokemon2) => {
  const stat1 = getStatValue(pokemon1, selectedStat.value);
  const stat2 = getStatValue(pokemon2, selectedStat.value);

  if (stat1 > stat2) {
    pokemon2.isDefeated = true; // El Pokémon del equipo 2 es derrotado
    team2DefeatedCount.value++;
  } else if (stat1 < stat2) {
    pokemon1.isDefeated = true; // El Pokémon del equipo 1 es derrotado
    team1DefeatedCount.value++;
  } else {
    // En caso de empate, ambos pierden
    pokemon1.isDefeated = true;
    pokemon2.isDefeated = true;
    team1DefeatedCount.value++;
    team2DefeatedCount.value++;
  }

  currentRound.value++;

  // Comprobar si se han completado todas las rondas
  if (currentRound.value > totalRounds.value) {
    determineWinner();
  }
};

// Determinar el ganador al final de las rondas
const determineWinner = () => {
  if (team1DefeatedCount.value < team2DefeatedCount.value) {
    winner.value = playerName ;
  } else if (team1DefeatedCount.value > team2DefeatedCount.value) {
    winner.value = "Equipo 2";
  } else {
    winner.value = "Empate";
  }
};

const winner = ref(null);

const canAttack = computed(() => {
  return selectedPokemon1.value.id && selectedPokemon2.value.id && !selectedPokemon1.value.isDefeated && !selectedPokemon2.value.isDefeated;
});

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
</script>

<style scoped>

button {
  padding: 10px 20px;
  background-color: #000000;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #45a049;
}

.battle-container {
  background-image: url(https://wallpapers-clan.com/wp-content/uploads/2023/11/pokemon-smiling-gengar-desktop-wallpaper-preview.jpg); /* Reemplaza con la URL de tu imagen */
  background-position: center; /* Centra la imagen */
  background-size: cover; /* Cubre el área de la carta */
  background-repeat: no-repeat; /* No repite la imagen */
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: #ccc;
}

.pokemon-wrapper {
  display: flex;
  justify-content: space-between;
  margin-top: -3%;
  color: #45a049;
}

.pokemon-side {
  width: 45%;
  text-align: center;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.pokemon-card {
  border: 1px solid #4CAF50;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
  color: rgba(255, 255, 255, 0.79);
}

.pokemon-card h3 h4 {
  font-size: 20px;
  position: relative; /* Para asegurarte de que el texto se vea bien sobre la imagen */
  z-index: 1; /* Asegúrate de que el texto esté por encima de la imagen */

}
.pokemon-card:hover {
  transform: scale(1.05);
}

.selected {
  border-color: #f44336;
}

.inactive {
  background-color: #ccc;
}

img {
  width: 90%;
  height:auto;
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
  background-color: #ec971f;
}

.restart-button {
  background-color: #b700ff; /* Cambia el color si lo deseas */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.restart-button:hover {
  background-color: #700092; /* Color al pasar el mouse */
}
.winner h2{
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}
</style>