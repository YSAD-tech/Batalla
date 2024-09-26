<template>
  <div class="battle-container">
    <h2>Batalla Pokémon</h2>

    <div class="pokemon-wrapper">
      <!-- Información del Pokémon 1 -->
      <div class="pokemon-side">
        <div v-if="pokemon1.data">
          <h3>{{ capitalizeFirstLetter(pokemon1.data.name) }}</h3>
          <img :src="pokemon1.data.sprites.other['official-artwork'].front_default" alt="Imagen de {{ pokemon1.data.name }}" />
          <p>HP: {{ pokemon1.hp }}</p>
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
        </div>
        <div v-else>
          <p>Cargando Pokémon 2...</p>
        </div>
      </div>
    </div>

    <!-- Botones de ataque -->
    <div class="attack-buttons" v-if="pokemon1.data && pokemon2.data && pokemon1.hp > 0 && pokemon2.hp > 0">
      <button @click="attack(pokemon1, pokemon2)">¡{{ capitalizeFirstLetter(pokemon1.data.name)  }} ataca!</button>
      <button @click="attack(pokemon2, pokemon1)">¡{{ capitalizeFirstLetter(pokemon2.data.name)  }} ataca!</button>
    </div>

    <!-- Mostrar el ganador -->
    <div v-else-if="winner">
      <h2>{{ capitalizeFirstLetter(winner) }} es el ganador!</h2>
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

// Inicializamos los Pokémon con valores reactivos
const pokemon1 = ref({
  id: getRandomPokemonId(),
  data: null,
  hp: 100,
  attackPower: 20
})

const pokemon2 = ref({
  id: getRandomPokemonId(),
  data: null,
  hp: 100,
  attackPower: 15
})

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Función de ataque
const attack = (attacker, defender) => {
  defender.hp -= attacker.attackPower
  if (defender.hp < 0) defender.hp = 0
}

// Computar el ganador
const winner = computed(() => {
  if (pokemon1.value.hp <= 0) {
    return pokemon2.value.data ? pokemon2.value.data.name : 'Desconocido'
  } else if (pokemon2.value.hp <= 0) {
    return pokemon1.value.data ? pokemon1.value.data.name : 'Desconocido'
  }
  return null
})

// Obtener los datos de los Pokémon cuando se monta el componente
onMounted(async () => {
  // Obtener datos de Pokémon 1
  pokemon1.value.data = await getPokemonData(pokemon1.value.id)
  pokemon1.value.hp = pokemon1.value.data.stats.find(stat => stat.stat.name === 'hp').base_stat

  // Obtener datos de Pokémon 2
  pokemon2.value.data = await getPokemonData(pokemon2.value.id)
  pokemon2.value.hp = pokemon2.value.data.stats.find(stat => stat.stat.name === 'hp').base_stat
})
</script>

<script>
// Filtro para capitalizar los nombres de los Pokémon
export default {
  filters: {
    capitalize(value) {
      if (!value) return ''
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  }
}
</script>

<style scoped>
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
