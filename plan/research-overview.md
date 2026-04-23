Research Overview Document  
Team 14  
AI Model: Codex 4.5 High

## **Summary of Research**

During our research phase, we focused on identifying a target audience and understanding what features would create a more engaging and sustainable slot machine experience. We chose to prioritize casual players, users seeking relaxation, utilitarian players, and social building groups. These users are generally not looking for high-risk gambling mechanics, but instead prefer accessible, low-pressure, and enjoyable gameplay experiences. Our research highlights the importance of creating a low-risk, visually engaging, progression-driven, and socially interactive experience tailored to casual and relaxed players, rather than focusing on traditional high-risk gambling dynamics.

## **Domain/User Insights**

Who are we favoring: 

* Casuals, Relaxation, Utilitarian, Social Building Groups. 

What do these groups want from the Slot Machine?

* Progression  
  * In relation to Theme, it gives an extra incentive for players to stick to the machine and keep playing.   
* Low costs for spins.   
  * If betting is included, the bets should not be too high as to avoid high risk high rewards feelings (Fear of Missing Out).   
* Leaderboards: Beneficial to building social prowess among other players.   
* Theming:   
  * Players choose & unlock their own themes to allow for progression and appeal to wider audiences.  
  * Themes should vary in appeal to draw in a wider audience.   
  * Flashy, visually appealing visual design to keep attention spans high.   
* Modes/Events:  
  * After a number of spins, something happens.   
  * Playing for long enough causes x to happen, where x is some random event beneficial to the player.   
* Free to Play Functionality(?):   
  * Slot Machine should clearly state clear information about monetization.   
  * Slot machines should also clearly communicate percentage rates of winning to avoid legal ramifications. 

## **Planned Slot Machine Specifications**

* Visuals  
  * Bright colors usually elicit more engagement in players, and lots of dark and light contrast (pitch black contrast with bright, neon golden yellow).   
    * Red: Usually correlates to increased engagement and decision-making patterns. (IE. Rerolling or making new bets after a loss).   
    * Blue: Measurable effects on session duration, linger play times.   
    * Gold & Yellow: Ranks highest in player preference surveys when associated w/ reward indicators and win celebrations.   
    * Green: positive associations with player confidence, especially in interactive components like buttons (spinning, selecting bet increases/decreases, etc.).   
  * Size of buttons: certain buttons are made to look bigger or more enticing in order to attract the user's attention and eyes to go for those (more risky or possibly impactful) button options.  
    * The center of attention should be the slot machine itself.   
    * Delegate space for other components such as the progression bar, spin combinations & their rates, Leaderboard(If it is being implemented).   
    * Button could also be lever, more action/animation could be more engaging to the player.   
  * Movement: the entire slot machine or particular buttons will move, pop out at you (user), or vibrate when something special occurs or a big win has been achieved.  
  * Multiple themes : Light, Dark, Classic? Fantasy? Cartoons?  
  * Cultural Elements:   
    * In relation to theming, some slot machines elicit symbols from different cultures to bring in more engagement. (Logic along the lines of appearing to be “exotic”).   
  * Slot Machine Symbols  
    * Simple ones: Fruit, 7s, Bells, Neon  
    * Dependent on the theme (could match with theme)  
* Sound:   
  * Different sounds depend on the theme.   
  * Music and Sound Effects should be loud/everpresent and clearly communicate wins and losses in such a way that a player can understand what result they got.   
  * Maybe energizing, exciting background music to subconsciously give the user a motivating or thrilling feeling to continue playing.   
  * Satisfying sound effects for spinning of slots, cashing in on prize (“cha-ching”), and super-boost power-ups (exclamatory congratulations sounds).  
* Functionality/Game Logic  
  * Different Combinations elicit different results.  
    * Ex. Multipliers, Chance Events, Jackpot scenarios.   
  * Progression:   
    * After a user plays for a set amount of spins/returns, some event or reward should be granted such that engagement is kept on continuing playtime.   
      * Some chance events from specific rolls can explicitly increase the progression bar, inciting users to keep playing and even “benefit” from objective financial losses.   
    * Progression Reward would be some specific money or unlocked theme that a player can use at their own discretion.   
  * Bonus or boost options:   
    * Before each spin, the user can choose to use coins to buy a bonus where they have several options that differ in number of spins and reward.   
    * Before each spin, the user can also choose a certain power-up or boost they want to apply to the next spin.   
* Identity Verification(?)  
  * If children are not allowed to play this game, steps should be taken by the game to either verify one’s identity or prevent further action from the violation.

## **Code Specifications**

* Clear and concise architecture.   
  * All Helper Functions are organized in specific spots.   
  * No reused code or functions that serve the same purpose.   
  * Avoid Adding Fully functional calculations that can be used in other functions exclusive to another function.   
* Comments  
  * Comments should clearly indicate the purpose of the function.   
  * Parameters and Return values (if applicable) are clearly explained for any reviewer to understand the purpose of.   
* Include Test Cases:   
  * Easily runnable test cases that test specific functions and aspects of the game in a fast and thorough manner.   
  * Test cases should also test for Code Exceptions to see if the output is able to handle faulty errors.   
* Edge Cases:   
  * Code should have a fallback on the instance a specific function does not work as intended.   
    * Example: A Null Error exception for a missing sound should be returned and allow the code to not crash on itself.   
* Security and Maintained Privacy  
  * Generated Code should be safe and prevent code breaking, information leaks data-mining if able to.   
* The entire output should also be split among multiple files, with each file handling specific grouped aspects of the game in a clearly indicated manner.   
  * Example: Some classes/files can exist and be referenced in other files (such as helper functions or Game Manager files). 