import Vue from 'vue'
import Vuex from 'vuex'

import createLogger from 'vuex/dist/logger'

import gameData from './modules/gameData'
import musicData from './modules/musicData'
import playerData from './modules/playerData'
import monsterData from './modules/monsterData'
import shopkeepData from './modules/shopkeepData'
import leaderboardData from './modules/leaderboardData'

Vue.use(Vuex);

const logger = createLogger({
  collapsed: false, // auto-expand logged mutations
  filter (mutation, stateBefore, stateAfter) {
    // returns `true` if a mutation should be logged
    // `mutation` is a `{ type, payload }`
    return mutation.type !== "aBlacklistedMutation"
  },
  actionFilter (action, state) {
    // same as `filter` but for actions
    // `action` is a `{ type, payload }`
    return action.type !== "aBlacklistedAction"
  },
  transformer (state) {
    // transform the state before logging it.
    // for example return only a specific sub-tree
    return state.subTree
  },
  mutationTransformer (mutation) {
    // mutations are logged in the format of `{ type, payload }`
    // we can format it any way we want.
    return mutation.type
  },
  actionTransformer (action) {
    // Same as mutationTransformer but for actions
    return action.type
  },
  logActions: true, // Log Actions
  logMutations: true, // Log mutations
  logger: console, // implementation of the `console` API, default `console`
})

export const store = new Vuex.Store({
  // plugins: process.env.NODE_ENV !== 'production' ? [logger] : [],
  modules: {
    gameData,
    musicData,
    playerData,
    monsterData,
    shopkeepData,
    leaderboardData
  },
});

// newShopkeep() {
// this.playerLog = [];
// this.monsterLog = [];
// let randomNumber = Math.floor(Math.random() * Math.floor(this.characters.shopKeeps.length));
// this.state.shopkeep = this.characters.shopKeeps[randomNumber];
// this.state.shopkeep.items = shuffle(this.state.shopkeep.items);
// this.state.shopInventory = this.state.shopkeep.items.slice(0,3);
// console.log(`new shop is ${this.state.shopkeep.name}`)
// },
