// project.js - purpose and description here
// Author: Edwin Fong
// Date: 4/7/24

// NOTE: This is how we might start a basic JavaaScript OOP project

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file

// define a class
class MyProjectClass {
  // constructor function
  constructor(param1, param2) {
    // set properties using 'this' keyword
    this.property1 = param1;
    this.property2 = param2;
  }
  
  // define a method
  myMethod() {
    // code to run when method is called
  }
}

function main() {
  // create an instance of the class
  let myInstance = new MyProjectClass("value1", "value2");

  // call a method on the instance
  myInstance.myMethod();
}

const fillers = {
  adventurer: ["Hero", "Knight", "Paladin", "Wizard", "Sage", "Tamer", "Archer", "Bowman", "Marksman", "Thief", "Assassin", "Scout", "$adventurer and $adventurer", "$adventurer, $adventurer, and $adventurer"],
  pre: ["Fra", "Tro", "Gre", "Pan", "Ast", "Ara"],
  post: ["gria", "ston", "gott", "ora"],
  people: ["weak", "fearful", "average", "scared", "fragile", "sickly"],
  item: ["advice", "guidance", "instructions"],
  num: ["one", "two"],
  looty: ["garbage", "common", "rare", "epic", "legendary", "mythic"],
  loots: ["rated weapon", "rated armor"],
  baddies: ["orcs", "goblin", "direwolves", "wyverns", "slimes", "ogers", "thieves"],
  message: ["call", "warning", "plea", "beckoning"],
  
};

const template = `Honorable $adventurer, heed my $message!

I have just come from $pre$post where the $people folk are in desperate need. Their town has been overrun by $baddies. You must venture forth at once, taking my $item, and help them.

It is told that the one who can rescue them will be awarded with $num $looty $loots. Surely this must tempt one such as yourself!
`;


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
