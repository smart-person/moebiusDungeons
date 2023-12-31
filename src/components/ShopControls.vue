<template>
<section class="shop">
  <!-- Shop Title Description -->

    <!-- Full Item Roll -->
    <section
    v-for="buyable in shopInventory"
    :key="buyable.name"
    :name="buyable.name"
    :id="buyable.id"
    :description="buyable.description"
    :cost="buyable.cost"
    @click="buy(buyable)"
    @mouseenter="UiSounds.chit.play()"
    :class="{
      'striked' : buyable.cost > coins, 
      'animated shakeX faster' : buyable.noSale, 
      'bought' : buyable.bought,
      'locked' : lockInteract
    }"
    class="itemRow"
    >
        <section class="description">
          <section class="cost">  
            <article>
              <img src="@/assets/imgs/icons/coinIcon.png">
              <h1>{{ buyable.cost }}</h1>
            </article>
          </section>

          <section class="itemText">
            <article>
              <h2>{{ buyable.name }}</h2>
              <p> {{ buyable.description }} </p>
            </article>
          </section>
        </section>
      
        <section class="itemIcon">
          <img :src="buyable.icon" alt="">
        </section>

        <article class="boughtAlert" v-if="buyable.bought">
          <h1>BOUGHT</h1>
        </article>

      </section>

      <SpecialBar/>

      <br>
      
      <section :class="{'locked' : lockInteract}" @mouseenter="UiSounds.chit.play()" @click="backToDungeon" class="backToDungeon">
        <h3>BACK TO THE DUNGEON</h3>
      </section>

</section>


</template>

<script>

import {mapState, mapGetters} from 'vuex'
import shuffle from 'lodash.shuffle'

import SpecialBar from '@/components/gameUI/SpecialBar.vue'

import UiSounds from '@/plugins/UiSounds.js'
import ShopSounds from '@/plugins/ShopSounds.js'
import ClericSounds from '@/plugins/ClericSounds.js'
import MerchantSounds from '@/plugins/MerchantSounds.js'
import GraveRobberSounds from '@/plugins/GraveRobberSounds.js'
import WitchSounds from '@/plugins/WitchSounds.js'

export default {
  name: 'ShopControls',
  components:{
    SpecialBar
  },
  data() {
    return {
      shake: false,
      UiSounds: UiSounds,
      Cleric: ClericSounds,
      Graverobber: GraveRobberSounds,
      Merchant: MerchantSounds,
      Witch: WitchSounds,
      failedBuy: 0,
      lockInteract: true,
    }
  },
  computed: {
    ...mapState('shopkeepData', {
      shopTitle: state => state.info.shopTitle,
      shopInventory: state => state.inventory,
      item1: state => state.inventory[0].icon,
      item2: state => state.inventory[1].icon,
      item3: state => state.inventory[2].icon,
      shopkeep: state => state.info,
      who: state => state.info.name,
      visited: state => state.visited
    }),
    ...mapState('playerData', {
      coins: state => state.info.coins
    }),
    ...mapGetters('shopkeepData', {
       haveVisited: 'haveVisited',
    }),
    whosSound: function () {
      switch (this.who) {
        case 'cleric':
          return this.Cleric
          break;
        case 'graverobber':
          return this.Graverobber
          break;
        case 'merchant':
          return this.Merchant
          break;
        case 'witch':
          return this.Witch
          break;
      }
    }
  },
  methods: {
    randomRoll(rollMax){
      return Math.floor(Math.random() * Math.floor(rollMax));
    },
    backToDungeon() {
      if(this.lockInteract === false) {
        this.$store.commit('gameData/mutate', {property: 'phase', with: 'DungeonPhase'})
      }
    },
    buy(itemBought) {
      if(this.lockInteract === false){
      this.lockInteract = true;
      if(itemBought.cost <= this.coins && itemBought.bought === false) {
        
        let roll = this.randomRoll(1);

        if(itemBought.cost <= 4){
          let randomSound = this.randomRoll(this.shopkeep.thankYou.length)
          this.whosSound[this.shopkeep.thankYou[randomSound]].play()
          this.whosSound[this.shopkeep.thankYou[randomSound]].on('end', () => {
            this.lockInteract = false;
          }).on('playerror', () => {
          this.lockInteract = false;
          }); 
        }
        else if (itemBought.cost === 5) {
          if(this.shopkeep.bigBuy.length > 0) {
          let randomSound = this.randomRoll(this.shopkeep.bigBuy.length)
            this.whosSound[this.shopkeep.bigBuy[randomSound]].play()
            this.whosSound[this.shopkeep.bigBuy[randomSound]].on('end', () => {
            this.lockInteract = false;
          }).on('playerror', () => {
          this.lockInteract = false;
          }); 
          }
          else {
            console.log(`No Sound Exists.`);
            this.lockInteract = false;
          }
        }
        
        // PLAYS COIN SOUNDS ON BUY
        roll++
        switch (itemBought.cost) {
          case 1:
            ShopSounds[`oneCoin${roll}`].play()
            break;
          case 2:
            ShopSounds[`twoCoin${roll}`].play()
            break;
          case 3:
            ShopSounds[`threeCoin${roll}`].play()
            break;
          case 4:
            ShopSounds[`fourCoin`].play()
            break;
          case 5:
            ShopSounds[`fiveCoin`].play()
            break;
        }

        // RUNS CORRESPONDING EFFECT IN SHOPKEEPDATA.JS 
        this.$store.dispatch('shopkeepData/' + itemBought.effect.action, itemBought.effect.payload)
        this.$store.dispatch('leaderboardData/compareToHighScore')
        itemBought.bought = true;

        // ADDS ICON TO PLAYERS INVENTORY IF THEY'RE TEMPORARY OR PERMANENT
        if(itemBought.type === 'temporary' || itemBought.type === 'permanent') {
          this.$store.commit('playerData/addToInventory', itemBought, {root:true})
        }

        // SUBTRACTS COST OF ITEM FROM PLAYERS COINS
        this.$store.commit('playerData/buyItem', itemBought.cost)

        this.$store.commit('leaderboardData/incrementByValue', {property:'coinsSpent', with:itemBought.cost}, {root:true})
      } 
      
      else {
        //TOGGLES ITEMS BOUGHT ANIMATION 
        itemBought.noSale = true;
        
        setTimeout(() => {
        // PLAYS SHOPKEEP SOUND EFFECT FROM SHOPKEEPDATA.JS
        if (this.failedBuy > 2){
           this.$store.commit('gameData/mutate', {property:'phase', with:'DungeonPhase'}, {root:true})
        }
        else { 
          if(this.shopkeep.cantBuy.length > 0){
            let randomSound = this.randomRoll(this.shopkeep.cantBuy.length)
            this.whosSound[this.shopkeep.cantBuy[randomSound]].play()
            this.whosSound[this.shopkeep.cantBuy[randomSound]].on('end', () => {
            this.lockInteract = false;
          }).on('playerror', () => {
          this.lockInteract = false;
          }); 
          }

          else if (this.shopkeep.cantBuy.length === 0) {
            ShopSounds['cantBuy'].play()
            ShopSounds['cantBuy'].on('end', () => {
            this.lockInteract = false;
          }).on('playerror', () => {
            this.lockInteract = false;
          }); 
          }
          this.failedBuy++;
          itemBought.noSale = false;
          }
        }, 500);
      }
      }
    }
  },
  mounted() {
    if(this.haveVisited) {
      let randomSound = this.randomRoll(this.shopkeep.welcomeBack.length)
      this.whosSound[this.shopkeep.welcomeBack[randomSound]].play()
      this.whosSound[this.shopkeep.welcomeBack[randomSound]].on('end', () => {
        this.lockInteract = false;
      }).on('playerror', () => {
        this.lockInteract = false;
      }); 
    } else {
      let randomSound = this.randomRoll(this.shopkeep.welcome.length)
      this.whosSound[this.shopkeep.welcome[randomSound]].play()
      this.whosSound[this.shopkeep.welcome[randomSound]].on('end', () => {
        this.lockInteract = false;
      }).on('playerror', () => {
        this.lockInteract = false;
      }); 
      this.$store.commit('shopkeepData/recordVisit')
    }
  },
  beforeDestroy() {
      let randomSound = this.randomRoll(this.shopkeep.goodbye.length)
      this.whosSound[this.shopkeep.goodbye[randomSound]].play()
      this.whosSound[this.shopkeep.goodbye[randomSound]].on('end', () => {
        this.lockInteract = true;
      })
  }
}
</script>

<style scoped>

.shop {
  margin-top:25px;
}

.itemRow {
  display:flex;
  justify-content: center;
  align-items:center;
  position:relative;
  margin:4px 0px;
}

.itemRow:hover {
    background: rgb(253,229,144);
    cursor:pointer;
}

.description {
  border: solid 2px black;
  padding:5px 5px;
  width:180px;
  min-height:100%;
  display:flex;
  flex-direction:row;
  align-items:center;
  justify-content:flex-start;
  transition: all .3s ease-in-out
}

.itemIcon img {
  width:68px;
  margin-left:5px;
  margin-top:5px;
  margin-right:5px;
}

.itemText {
  text-align:center;
  width:100%;
  margin-left:10px;
}

h2 {
  font-size: 15px;
  text-decoration: none;
  text-align:center;
  margin:0;
  padding:0;
}

article h2 {
  text-align: center;
  font-size:15px;
}

p {
  display:block;
  text-align:center;
  font-size:12px;
  padding:0 0 0px 0;
  margin:0;
}

.battleOptions {
  min-width:215px;
  width:210px;
  margin:0;
}

.buySlot {
  position:relative;
  padding:10px;
  /* background: rgba(207, 207, 207, 1); */
  margin:0 0 0px 0;
}

.cost {
  position:relative;
  width:30%;
}

.cost article > img {
  width:55px;
  max-width:55px;
  margin:0 10px 0 0;
}

.cost h1 {
  position:absolute;
  margin:0;
  margin-block-start: 0;
  margin-block-end: 0;
  line-height: 55px;
  top:0px;
  text-align:center;
  width:55px;
}

.flexRow {
  height:50px;
}

.striked {
  text-decoration:line-through;
  background: rgb(255, 75, 75);
  transition: all .3s ease-in-out
}

.striked:hover{
  cursor:not-allowed;
  background: rgb(255, 24, 24);
}

.bought {
  cursor:not-allowed;
  opacity:.2;
  transition: all .3s ease-in-out
}

.boughtAlert h1{
  color:red;
  text-shadow: none;
  position:absolute;
  left:15px;
  top:10px;
  margin:0;
  padding:0;
  margin-block-start: 0;
  margin-block-end: 0;
  opacity:1;
  font-size:39px;
}

.locked {
  cursor:not-allowed;
  opacity:.2;
  transition: all .3s ease-in-out
}

.locked:hover {
  cursor:not-allowed;
}


h1 {
  color:white;
  text-shadow: black -2px 2px 2px;
}

.backToDungeon {
  text-align:center;
  border:2px solid black;
  padding:5px 0;
  margin-top:5px;
}

.backToDungeon:hover {
  background: rgb(253,229,144);
  cursor:pointer;
}
</style>
