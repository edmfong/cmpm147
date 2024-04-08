// project.js - purpose and description here
// Author: Edwin Fong
// Date: 4/7/24

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file


function main() {
  const fillers = {
    adventurer: ["Hero", "Knight", "Paladin", "Wizard", "Sage", "Tamer", "Archer", "Bowman", "Marksman", "Thief", "Assassin", "Scout", "$adventurer and $adventurer", "$adventurer, $adventurer, and $adventurer"],
    pre: ["Fra", "Tro", "Gre", "Pan", "Ast", "Ara"],
    post: ["gria", "ston", "gott", "ora"],
    people: ["weak", "fearful", "average", "scared", "fragile", "sickly"],
    num: ["one", "two"],
    looty: ["garbage", "common", "rare", "epic", "legendary", "mythic"],
    loots: ["rated weapon", "rated armor"],
    baddies: ["orcs", "goblin", "direwolves", "wyverns", "slimes", "ogers", "thieves"],
    message: ["danger", "peril", "jeopardy"],
    
  };
  
  const template = 
  `You enter the guild, looking for a job. The following parchment states...\n
Honorable $adventurer, we are in $message!\n
Thw town of $pre$post is swarmed in a hoard of $baddies. The $people villagers are in $message and are in desperate need. I bed you, please help us.\n
The adventurer's guild will awarded the heros with $num $looty $loots.\n\n`;
  
  
  // STUDENTS: You don't need to edit code below this line.
  
  const slotPattern = /\$(\w+)/;
  
  function replacer(match, name) {
    let options = fillers[name];
    if (options) {
      return options[Math.floor(Math.random() * options.length)];
    } else {
      return `<UNKNOWN:${name}>`;
    }
  }
  
  function generate() {
    let story = template;
    while (story.match(slotPattern)) {
      story = story.replace(slotPattern, replacer);
    }
  
    /* global box */
    $("#box").text(story);
  }
  
  /* global clicker */
  $("#clicker").click(generate);
  
  generate();
}

main();