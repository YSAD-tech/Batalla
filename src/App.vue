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
          <div v-for="pokemon in team1" :key="pokemon.id" class="pokemon-card"
            :class="{ selected: selectedPokemon1.id === pokemon.id, loser1: pokemon.isDefeated, winner1: pokemon.isWinner }"
            @click="selectPokemon1(pokemon)" :style="{ opacity: pokemon.isDefeated ? 0.5 : 1 }">
            <h3>{{ capitalizeFirstLetter(pokemon.data.name) }}</h3>
            <img :src="pokemon.data.sprites.other['official-artwork'].front_default"
              alt="Imagen de {{ pokemon.data.name }}" />
          </div>
        </div>
      </div>

      <!-- Información del equipo 2 -->
      <div class="pokemon-side">
        <h3>Bot (Equipo 2)</h3>
        <div class="pokemon-grid">
          <div v-for="pokemon in team2" :key="pokemon.id" class="pokemon-card"
            :class="{ loser1: pokemon.isDefeated, winner1: pokemon.isWinner }"
            :style="{ opacity: pokemon.isDefeated ? 0.5 : 1 }">
            <h3>{{ capitalizeFirstLetter(pokemon.data.name) }}</h3>
            <img :src="pokemon.data.sprites.other['official-artwork'].front_default"
              alt="Imagen de {{ pokemon.data.name }}" />
          </div>
        </div>
      </div>

    </div>

    <!-- Botones de ataque -->
    <div class="attack-buttons" v-if="canAttack">
      <button @click="attack(selectedPokemon1, selectedPokemon2)">¡{{ capitalizeFirstLetter(selectedPokemon1.data.name)
        }} ataca!</button>
    </div>
    <!-- Mostrar el mensaje de la batalla -->
    <div v-if="battleMessage" class="battle-message">
      <h3>{{ battleMessage }}</h3>
    </div>

    <!-- Mostrar el ganador -->
    <div class="winner" v-else-if="winner">
      <h4>{{ winner }} es el ganador de la batalla!!</h4>
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

// Al final del combate, puedes reiniciar el estado de los Pokémon
const resetPokemonState = () => {
  team1.value.forEach(pokemon => {
    pokemon.isWinner = false;
    pokemon.isDefeated = false;
  });

  team2.value.forEach(pokemon => {
    pokemon.isWinner = false;
    pokemon.isDefeated = false;
  });
};

const resetBattle = () => {
  currentRound.value = 1;
  team1DefeatedCount.value = 0;
  team2DefeatedCount.value = 0;

  resetPokemonState(); // Reinicia el estado de los Pokémon
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
const battleMessage = ref('');
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
      isWinner: false,
      isDefeated: false, // Indicador de si el Pokémon fue derrotado
      isSelected: false,  // Indicador de si el Pokémon fue seleccionado
    });

    team2.value.push({
      id: pokemonId2,
      data: data2,
      isWinner: false,
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

  // Generar el mensaje de la batalla
  const battleMessage = `${capitalizeFirstLetter(pokemon1.data.name)} ataca a ${capitalizeFirstLetter(pokemon2.data.name)}!`;

  // Mostrar la notificación con el mensaje de la batalla
  $q.notify({
    message: battleMessage,
    color: 'orange',
    position: 'top',
  });

  if (stat1 > stat2) {
    pokemon2.isDefeated = true; // El Pokémon del equipo 2 es derrotado
    pokemon1.isWinner = true;    // Pokémon del equipo 1 es el ganador
    team2DefeatedCount.value++;
  } else if (stat1 < stat2) {
    pokemon1.isDefeated = true; // El Pokémon del equipo 1 es derrotado
    pokemon2.isWinner = true;    // Pokémon del equipo 2 es el ganador
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
    winner.value = playerName.value;
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
.winner1 {
  background-color: rgba(76, 175, 80, 0.5);
  /* Verde translúcido */
}

.loser1 {
  background-color: rgba(244, 67, 54, 0.5);
  /* Rojo translúcido */
}


.battle-message {
  margin-top: 20px;
  font-size: 24px;
  color: #f0ad4e;
}

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
  background-image: url(https://wallpapers-clan.com/wp-content/uploads/2023/11/pokemon-smiling-gengar-desktop-wallpaper-preview.jpg);
  /* Reemplaza con la URL de tu imagen */
  background-position: center;
  /* Centra la imagen */
  background-size: cover;
  /* Cubre el área de la carta */
  background-repeat: no-repeat;
  /* No repite la imagen */
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: #ccc;
  position: relative;
  /* Necesario para que el botón se posicione en relación al contenedor */
  min-height: 300px;
  /* Establece una altura mínima para evitar cambios de tamaño */
  padding-bottom: 60px;
  /* Espacio para el botón "Volver a Jugar" */
}

.pokemon-wrapper {
  display: flex;
  justify-content: space-between;
  margin-top: -5%;
  color: #45a049;
  margin-bottom: 15px;
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
  position: relative;
  /* Para asegurarte de que el texto se vea bien sobre la imagen */
  z-index: 1;
  /* Asegúrate de que el texto esté por encima de la imagen */

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
  height: auto;
}

.attack-buttons {
  min-height: 60px;
  /* Reserva espacio para los botones de ataque, incluso si están ocultos */
  display: flex;
  justify-content: center;
  /* Centra los botones */
  align-items: center;
  /* Alinea verticalmente */
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.battle-message {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  text-align: center;
  min-height: 60px;
  /* Reserva espacio para el mensaje */
}

.battle-message,
.attack-buttons,
.winner {
  min-height: 50px;
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
  position: absolute;
  bottom: 20px;
  /* Distancia desde la parte inferior */
  right: 20px;
  /* Distancia desde la derecha */
  background-color: #b700ff;
  /* Mantén el color del botón */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  padding: 10px 20px;
  /* Tamaño del botón */
  transition: background-color 0.3s ease;
}

.restart-button:hover {
  background-color: #700092;
  /* Color al pasar el mouse */
}

.winner h4 {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.contenedor {
  background-image: url(https://steamuserimages-a.akamaihd.net/ugc/1690499676527753284/58A4A8691135FAB510042A54EDD97EB159EBE9E1/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true);
  background-position: center !important;
  background-size: cover !important;
  background-repeat: no-repeat !important;
  text-align: center !important;
  margin-top: 50px !important;
  padding: 20px !important;
  border: 2px solid #ffffff !important;
  border-radius: 10px !important;
  width: 90%;
  background-color: #f9f9f9 !important;
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0) !important;
  color: #ffffff !important;
  margin: auto;
  max-width: 600px;
}

.winner.contenedor h2 {
  color: #ffffff !important;
  margin-bottom: 20px !important;
}

.contenedor label {
  margin-right: 10px !important;
  font-weight: bold !important;
}

.contenedor select,
.contenedor input {
  margin-bottom: 20px !important;
  padding: 10px !important;
  border: 1px solid #00000000 !important;
  border-radius: 5px !important;
}

.input-group {
  font-size: 20px;
}

.input-group input,
select {
  width: 58%;
}

.winner h4 {
  background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet);
  -webkit-background-clip: text;
  color: transparent;
}

/* Media Query para pantallas menores o iguales a 550px */
@media (max-width: 550px) {
  .contenedor {
    padding: 10px;
    /* Reducir el padding en pantallas pequeñas */
  }

  .battle-container h2 {
    font-size: 20px;
  }

  .pokemon-side {
    width: 100%;
    /* Hacer que los lados ocupen el 100% */
    margin: 0;
    /* Espacio entre los equipos */
    margin-top: -15px;
  }

  .battle-container {
    width: 550px;
    height: 580px;
    margin-left: -12%;
  }

  .pokemon-grid {
    margin: 0;
    margin-right: 10px;
  }

  .pokemon-card h3 {
    font-size: 8px !important;
  }

  .pokemon-card {
    margin: 0;
    /* Centrar las cartas */
  }

  .attack-buttons {
    flex-direction: column;
    /* Colocar botones en columna */
    margin-top: 10px;
    /* Espacio superior para botones */
  }

  .attack-buttons button {
    margin-bottom: 10px;
    /* Espacio entre los botones */
  }

  .restart-button {
    width: auto;
    /* Mantener tamaño automático */
    position: static;
    /* Quitar posición absoluta */
    margin: 10px auto;
    /* Centrar el botón */
  }

  .contenedor h2 {
    font-size: 50px;
  }

  /* Ajustar tamaño de texto */
  .contenedor label,
  .contenedor select,
  .contenedor input {
    font-size: 16px;
    /* Reducir tamaño de fuente */
  }

  .winner h4 {
    margin: 0;
    font-size: 23px;
    /* Reducir tamaño de fuente del ganador */
  }

  .input-group label {
    font-size: 20px;
  }
}
</style>