**Slot Machine Research Notes**

Author: Rena Tokhi 

Date: April 19 2026 

# **What is a Slot Machine?**

A slot machine is a game where you spin a set of reels (columns with symbols on them) and try to get matching symbols in a row to win you put in a bet hit spin and if the symbols line up on a payline you win coins based on what matched

Classic slot machines have 3 reels newer ones usually have 5 

The result of each spin is randomly determined by a Random Number Generator Every spin is independent so past spins don't affect future ones

# **Basic Parts of a Slot Machine**

* **Reels:**  the spinning columns Each reel shows one symbol when it stops  
* **Symbols:** the images on the reels Classic ones include cherries lemons bells bars and the lucky 7  
* **Payline:** the line where you check for matches A simple slot has one payline across the middle row  
* **Bet:** the amount you wager per spin Players should be able to increase or decrease this  
* **Balance:** how many coins/credits the player has Goes down when you bet goes up when you win  
* **Paytable:** a chart that shows what each winning combination pays out

# **Common Symbols and What They Pay**

| Symbol | Value |
| :---- | :---- |
| Cherry | Lowest payout |
| Lemon | Low payout |
| Bell | Medium payout |
| Bar | High payout |
| Lucky 7 | Jackpot / highest payout |

Some games also have a Wild (acts like a wildcard can substitute for any symbol) and a Scatter (pays no matter where it lands) For our basic version we'll probably skip those to keep things simple

# **How Winning Works**

A player wins when they get matching symbols on the payline The payout depends on which symbols matched  higher value symbols pay out more

For example:

* 3 cherries \= small win (2x your bet)  
* 3 bells \= medium win (5x your bet)  
* 3 lucky 7s \= jackpot (20x your bet)

# **What Makes a Good Slot Machine (UX)**

After looking at a few online slot machine demos and apps here are things that made them feel good to use:

* Big obvious spin button  you always know what to press  
* Balance always visible  players need to know what they have left  
* Clear message after each spin  did I win? How much?  
* Easy way to change your bet  simple \+ and \- buttons work great  
* A paytable button somewhere on screen  so players know what pays what  
* Some kind of win animation  even just flashing text makes it feel rewarding  
* Works on mobile  a lot of people play these on their phones

# **Visual Theme**

There are tons of themes for slot machines ancient Egypt space fantasy fruits etc

 I decided to go with Classic Vegas because:

* Everyone knows what it looks like  
* The symbols (7s bells cherries) are simple and easy to implement  
* Clear color palette to work with  dark background gold and red accents neon feel

# **Technical Notes:**

* We'll can HTML CSS and JavaScript  no frameworks needed for a basic slot  
* Game logic (spin check winning update balance) should be separate from the display code  
* We can use emoji or simple text for symbols in a prototype then style them up  
* The spin animation can just be CSS  no need for a canvas library  
* Balance bet and game state can be tracked in JavaScript variables or a simple object  
* The most testable parts are: payout calculation win detection and balance updates

# **Sources / Where I Looked**

* [How Slot Machines ACTUALLY Work  A Software Engineer Breaks Down the Code](https://www.youtube.com/watch?v=fuYBV20ZFDM)  
* [How it Works: Slot Machines Full Tech Breakdown](https://www.youtube.com/watch?v=OPCAqjswBzM)  
* [How slot machines work | Know this before playing](https://www.youtube.com/watch?v=yegxMTVMoJc)  
* [CSS/JS Slot Machine \- CodePen](https://codepen.io/MrFirthy/pen/oGVWqK)  
* [html5-slot-machine \- GitHub](https://github.com/johakr/html5-slot-machine)  
* [Simple-HTML-Slot-Machine \- GitHub](https://github.com/JonR93/Simple-HTML-Slot-Machine)  
* [How a Slot Machine RNG Works \- Cache Creek Casino](https://www.cachecreek.com/slot-machine-rng)  
* [Slot Game Optimization & UX Design \- Gammastack](https://www.gammastack.com/blog/slot-game-optimization-increasing-player-retention-through-ux-design/)

**Persona 1: The Curious First-Timer**

**Name:** Lila  Mills

**Age:** 21

**Occupation:** College junior studying Communications

**Location:** Boston MA

**Device:** iPhone mostly plays between classes 

# **Who is Jordan?**

Lila  has never set foot in a real casino The closest thing was a casino night fundraiser at their university last semester They played a slot machine for the first time and honestly kind of loved it not because they won (they didn't) but because it was just fun the sounds the spinning the small rush of not knowing what's coming next

Now Lila wants to play one online just for fun **No real money involved** She is not trying to get good at it or figure out odds she just wants to tap a button and feel something happen

Lila has a pretty short attention span for things that require explanation if the game needs a tutorial she is already gone

# **What Lila Wants**

* To just start playing without having to read anything  
* To always know how much she have left in her balance  
* To feel like something cool happened when she win even a small animation goes a long way  
* To be able to lower her bet if she is running low on coins  
* To know what the symbols mean without digging through menus

# **What Frustrates Lila**

* Too many buttons  it looks overwhelming and she don't know where to click  
* No feedback after spinning    
  * Did I win?   
  * Did I lose?   
  * What happened?  
* The game locking up or freezing mid-spin  
*  Having to reload because the balance isn't updating right  
*  Games that feel like they were designed for someone else   
  * too complicated  
  * too corporate

# **A Typical Session**

Lila opens the game between classes They have about 10 minutes They hit spin a bunch of times adjust the bet once or twice get excited when the reels match up and close the tab when class starts That's it No deep strategy Just vibes

 

# **Quote**

"I don't need it to be fancy I just want to spin and know if I won" 

# **What This Means for Our Game**

* The spin button needs to be the most obvious thing on the screen  
*  Win and loss feedback has to be instant and clear  
* The balance should always be visible  no hunting for it  
* Bet controls should be simple (just a \+ and \- button)  
*  The paytable should be one tap away not buried

 

**User Stories**

# **User Story 1  Spinning the Reels**

 

As a first-time player who just wants to jump in and have fun

I want to hit a big obvious spin button and immediately see the reels spin and land on symbols

so that I can start playing without needing to figure out how anything works first

**What done looks like**

* There's one main button that's hard to miss  it says SPIN and it's centered on screen  
* Clicking it or pressing spacebar starts the spin right away  
* The reels actually animate  they spin and then stop not just snap to a result  
* Once the reels stop I know immediately if I won or lost a message shows up  
* The button is disabled while spinning so I can't accidentally double-click

# **User Story 2  Knowing My Balance and Adjusting My Bet**

 As a casual player trying to make my coins last a little longer

I want to always see how many coins I have left and be able to lower my bet when I'm running low so that I don't accidentally run out of coins without realizing it

**What done looks like**

*  My balance is always visible on screen  no hiding it in a menu  
* There are simple \+ and \- buttons to change my bet before I spin  
* The bet can't go below 1 coin or above the max  
* If my balance is less than my bet the spin button is grayed out and tells me why  
* After every spin the balance updates right away  no lag or confusion• 

 

 

