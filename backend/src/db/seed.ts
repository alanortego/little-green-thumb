/**
 * Idempotent demo-data seed for local quickstart validation (T076).
 * Safe to run repeatedly — skips seeding if the demo admin already exists.
 * ponytail: no dedicated migration framework; this piggybacks on the same
 * getDb() that applies schema.sql on first use.
 */
import bcrypt from 'bcryptjs';
import { closeDb, getDb } from './connection.js';

const DEMO_PASSWORD = 'password123';

// Recipes sourced from a kid-friendly-vegetable-recipes reference doc, one entry
// per plant/vegetable that has a matching plant seeded below.
const recipeSeeds: { plantName: string; name: string; steps: string[] }[] = [
  { plantName: 'Cauliflower', name: 'Popcorn Cauliflower Bites', steps: ['Adult heats oven to 425°F', 'Kid puts cauliflower florets in a big bowl', 'Kid drizzles oil over florets and mixes with hands until coated', 'Kid adds breadcrumbs, parmesan, and salt, then tosses to coat', 'Adult spreads florets on a baking sheet and bakes 20 minutes', 'Let cool a bit, then dip in ketchup or ranch!'] },
  { plantName: 'Cauliflower', name: 'Cauliflower "Mashed Potatoes"', steps: ['Adult boils cauliflower in water for 10 minutes until soft', 'Adult drains the cauliflower into a colander', 'Kid puts cauliflower in a bowl with butter and milk', 'Kid mashes with a fork or potato masher until smooth', 'Kid stirs in a pinch of salt and serves'] },
  { plantName: 'Cauliflower', name: 'Cauliflower Pizza Crust Bites', steps: ['Adult heats oven to 400°F', 'Kid squeezes extra water out of cauliflower rice using a clean towel (adult helps)', 'Kid mixes cauliflower, egg, cheese, and oregano in a bowl', 'Kid shapes small mounds onto a lined baking sheet and flattens into rounds', 'Adult bakes 15–20 minutes until golden', 'Kid adds a dab of sauce and a mini pepperoni on top to serve'] },
  { plantName: 'Carrot', name: 'Carrot Coin Necklace Snack', steps: ['Adult peels the carrots', 'Adult slices carrots into thin coins', 'Kid arranges the coins in a circle pattern on a plate like a necklace', 'Serve with a small cup of hummus or yogurt dip in the middle'] },
  { plantName: 'Carrot', name: 'Sweet Roasted Carrot Fries', steps: ['Adult heats oven to 400°F', 'Adult cuts carrots into fry shapes', 'Kid puts carrot sticks in a bowl, drizzles oil, and tosses to coat', 'Kid sprinkles cinnamon or salt over the top', 'Adult spreads on a tray and bakes 20 minutes, flipping once'] },
  { plantName: 'Carrot', name: 'Carrot & Raisin Smiley Salad', steps: ['Adult grates the carrots (or use a pre-shredded bag)', 'Kid mixes grated carrot, yogurt, and honey in a bowl', 'Kid spoons the mix onto a plate and flattens slightly', 'Kid uses raisins to make a smiley face on top'] },
  { plantName: 'Broccoli', name: 'Broccoli Tree Forest with Dip', steps: ['Adult steams broccoli for 4 minutes until bright green and slightly soft', 'Kid runs the broccoli under cold water to cool it down', 'Kid stands florets up on a plate like little trees', 'Kid pours dip into a small bowl in the middle of the "forest"', 'Dip and eat!'] },
  { plantName: 'Broccoli', name: 'Cheesy Broccoli Bites', steps: ['Adult steams and finely chops the broccoli', 'Kid mixes broccoli, egg, cheese, and breadcrumbs in a bowl', 'Kid shapes small balls or patties with their hands', 'Adult bakes at 375°F for 15–18 minutes until golden'] },
  { plantName: 'Broccoli', name: 'Broccoli Pasta Confetti', steps: ['Adult boils pasta according to package directions', 'Adult adds chopped broccoli to the pasta water for the last 3 minutes', 'Adult drains pasta and broccoli together', 'Kid stirs in butter and parmesan until melted and mixed', 'Serve warm'] },
  { plantName: 'Tomato', name: 'Tomato Caprese Stackers', steps: ['Adult halves the cherry tomatoes', 'Kid stacks a tomato half, a mozzarella ball, and a basil leaf onto a toothpick', 'Kid repeats to make several stackers', 'Kid drizzles a little olive oil over the top before serving'] },
  { plantName: 'Tomato', name: 'Homemade Tomato Dipping Sauce', steps: ['Adult heats oil in a pan over medium heat', 'Adult adds tomatoes and cooks for 10 minutes, stirring occasionally', 'Kid adds a pinch of salt and garlic powder', 'Adult blends or mashes until smooth (or leave it chunky)', 'Let cool slightly and use as a dip for bread sticks or crackers'] },
  { plantName: 'Tomato', name: 'Tomato Face Toast', steps: ['Adult toasts the bread', 'Kid spreads cream cheese over the toast', 'Kid places tomato slices for eyes and a cucumber slice for a smile', 'Enjoy the silly toast face!'] },
  { plantName: 'Radish', name: 'Radish Flower Bites', steps: ['Adult trims and slices the radishes very thin', 'Kid arranges radish slices into a flower shape on a plate (overlapping like petals)', 'Kid spreads a little butter on crackers and tops with a radish "petal"', 'Sprinkle with a pinch of salt'] },
  { plantName: 'Radish', name: 'Crunchy Radish Ranch Dippers', steps: ['Adult slices radishes into sticks', 'Kid arranges radish sticks around a small bowl of ranch', 'Dip and crunch!'] },
  { plantName: 'Radish', name: 'Quick Pickled Radish Coins', steps: ['Adult slices radishes thin', 'Adult warms vinegar, water, sugar, and salt in a small pot until sugar dissolves', 'Kid places radish slices into a jar', 'Adult pours the liquid over the radishes (let cool a bit first)', 'Kid watches the radishes turn bright pink over the next hour in the fridge'] },
  { plantName: 'Swiss Chard', name: 'Rainbow Chard Chips', steps: ['Adult heats oven to 350°F', 'Kid tears chard leaves into chip-sized pieces (away from the thick stem)', 'Kid drizzles oil over the pieces and rubs gently to coat', 'Kid sprinkles a little salt on top', 'Adult bakes 10–12 minutes until crispy but not burnt'] },
  { plantName: 'Swiss Chard', name: 'Swiss Chard & Cheese Quesadilla', steps: ['Adult finely chops the chard', 'Kid sprinkles cheese and chard over half of one tortilla', 'Kid folds the tortilla in half', 'Adult cooks in a pan over medium heat, 2 minutes per side, until golden', 'Adult cuts into wedges to cool before serving'] },
  { plantName: 'Swiss Chard', name: 'Colorful Chard Stem Sticks with Hummus', steps: ['Adult cuts the colorful stems into finger-length sticks', 'Adult steams the stems for 3–4 minutes until slightly softened', 'Kid arranges sticks by color on a plate', 'Dip in hummus and eat'] },
  { plantName: 'Zucchini', name: 'Zucchini Noodle Nests', steps: ['Adult spiralizes the zucchini into noodles (or use a peeler for ribbons)', 'Adult heats oil in a pan and cooks noodles for 2–3 minutes', 'Kid twirls the noodles into little nest shapes on a plate', 'Kid sprinkles parmesan on top', '(Optional) Add a mozzarella ball "egg" in the middle of the nest'] },
  { plantName: 'Zucchini', name: 'Zucchini Pizza Rounds', steps: ['Adult slices zucchini into rounds', 'Kid spreads a small spoonful of sauce on each round', 'Kid sprinkles cheese on top and adds a pepperoni if using', 'Adult bakes at 400°F for 10 minutes until cheese melts'] },
  { plantName: 'Zucchini', name: 'Zucchini Chocolate Chip Muffins', steps: ['Adult grates the zucchini', 'Kid mixes flour, sugar, and baking soda in a big bowl', 'Kid adds egg, oil, and grated zucchini, and stirs until combined', 'Kid folds in chocolate chips', 'Adult pours batter into muffin tins and bakes at 350°F for 18–20 minutes'] },
  { plantName: 'Bell Pepper', name: 'Bell Pepper Rainbow Boats', steps: ['Adult slices peppers into strips (removing seeds and stem)', 'Kid arranges the strips by color like a rainbow on a plate', 'Kid spoons a little dip into each pepper strip "boat"'] },
  { plantName: 'Bell Pepper', name: 'Stuffed Pepper Cups (Mini Version)', steps: ['Adult halves and seeds the peppers', 'Kid mixes rice, cheese, and turkey or beans in a bowl', 'Kid spoons the mixture into each pepper half', 'Adult bakes at 375°F for 20 minutes until pepper is tender'] },
  { plantName: 'Bell Pepper', name: 'Bell Pepper Pizza Faces', steps: ['Adult slices the pepper into rings, removing seeds', 'Kid spreads sauce inside each ring', 'Kid sprinkles cheese on top', 'Kid adds olive slices to make a funny face', 'Adult bakes at 400°F for 8–10 minutes until cheese melts'] },
  { plantName: 'Jalapeño', name: 'Mild Jalapeño Popper Dip (kid taste-test size)', steps: ['Adult removes the seeds and veins from the jalapeño (this is where most of the heat lives)', 'Adult finely dices the jalapeño', 'Kid mixes cream cheese, cheddar, and a small pinch of the diced jalapeño in a bowl', 'Adult bakes at 350°F for 10 minutes until warm and bubbly', 'Serve with crackers for scooping'] },
  { plantName: 'Jalapeño', name: 'Jalapeño Cornbread Muffins (mild)', steps: ['Adult seeds and finely dices the jalapeño', 'Kid mixes cornmeal, flour, and sugar in a bowl', 'Kid adds egg and milk, stirring until combined', 'Kid stirs in a small pinch of the diced jalapeño', 'Adult bakes in a muffin tin at 375°F for 15–18 minutes'] },
  { plantName: 'Jalapeño', name: 'Jalapeño Seed-Free Salsa (kid-mild)', steps: ['Adult removes all seeds and veins from the jalapeño and dices a very small amount', 'Adult dices the tomato and onion', 'Kid mixes tomato, onion, and a tiny pinch of jalapeño in a bowl', 'Kid squeezes lime juice over the top and stirs', 'Taste-test a small amount before serving'] },
  { plantName: 'Brussels Sprout', name: 'Brussels Sprout "Mini Cabbage" Chips', steps: ['Adult heats oven to 400°F', 'Kid peels off the outer leaves of each Brussels sprout into a bowl', 'Kid drizzles oil over the leaves and tosses to coat', 'Kid sprinkles a little salt', 'Adult bakes for 8–10 minutes until crispy and golden'] },
  { plantName: 'Brussels Sprout', name: 'Honey Roasted Brussels Sprouts', steps: ['Adult halves the Brussels sprouts', 'Adult heats oven to 400°F', 'Kid tosses sprouts with oil, honey, and salt in a bowl', 'Adult spreads on a tray and roasts 20 minutes, flipping halfway'] },
  { plantName: 'Brussels Sprout', name: 'Brussels Sprout & Cheese Skewers', steps: ['Adult steams the Brussels sprouts until fork-tender, about 8 minutes', 'Adult lets them cool slightly', 'Kid threads a Brussels sprout and a cheese cube onto each skewer', 'Serve at room temperature'] },
  { plantName: 'Cabbage', name: 'Rainbow Cabbage Slaw', steps: ['Adult shreds the cabbage (or use a pre-shredded bag)', 'Kid mixes cabbage and carrot together in a big bowl', 'Kid stirs in mayo/yogurt and honey', 'Kid tosses everything together with tongs or clean hands'] },
  { plantName: 'Cabbage', name: 'Cabbage Leaf Taco Cups', steps: ['Adult washes and separates the cabbage leaves', 'Kid spoons turkey or beans into the center of each leaf', 'Kid adds cheese and tomato on top', 'Kid folds the leaf like a taco to eat'] },
  { plantName: 'Cabbage', name: 'Sweet & Sour Cabbage Stir-Fry', steps: ['Adult shreds the cabbage', 'Adult heats oil in a pan over medium heat', 'Adult adds cabbage and cooks, stirring, for 5 minutes', 'Kid stirs in soy sauce and honey', 'Adult cooks 2 more minutes until cabbage is soft'] },
  { plantName: 'Beans', name: 'Bean & Cheese Quesadilla', steps: ['Kid mashes the beans a little with a fork in a bowl', 'Kid spreads beans and cheese over half of one tortilla', 'Kid folds the tortilla in half', 'Adult cooks in a pan over medium heat, 2 minutes per side', 'Adult cuts into wedges to cool'] },
  { plantName: 'Beans', name: 'Bean Dip with Veggie Dippers', steps: ['Kid mashes beans in a bowl with a fork', 'Kid stirs in salsa and a pinch of cumin', 'Adult warms the mixture in a pan for 2–3 minutes if desired', 'Serve with veggie sticks or crackers'] },
  { plantName: 'Beans', name: 'Rainbow Bean Salad', steps: ['Adult rinses and drains all the beans and corn', 'Kid mixes beans, corn, and bell pepper in a big bowl', 'Kid squeezes lime juice over the top', 'Kid adds a pinch of salt and stirs'] },
  { plantName: 'Okra', name: 'Crispy Baked Okra Chips', steps: ['Adult slices okra into rounds', 'Kid tosses okra with oil in a bowl', 'Kid adds cornmeal and salt, tossing to coat evenly', 'Adult spreads on a tray and bakes at 425°F for 20 minutes, flipping once'] },
  { plantName: 'Okra', name: 'Okra & Tomato Skillet', steps: ['Adult slices the okra and dices the tomatoes', 'Adult heats oil in a pan over medium heat', 'Adult adds okra and tomatoes, cooking for 8–10 minutes, stirring occasionally', 'Kid adds a pinch of salt and stirs before serving'] },
  { plantName: 'Okra', name: 'Okra "Fry" Sticks with Dip', steps: ['Kid rinses the whole okra pods', 'Kid tosses okra with oil and paprika in a bowl', 'Adult spreads on a tray and roasts at 400°F for 15 minutes', 'Serve with ketchup for dipping'] },
  { plantName: 'Lima Beans', name: 'Buttery Lima Bean Mash', steps: ['Adult cooks lima beans until very soft (if using dried, adult boils ahead of time)', 'Kid mashes the beans with a fork or masher', 'Kid stirs in butter, a splash of milk, and a pinch of salt', 'Serve warm'] },
  { plantName: 'Lima Beans', name: 'Lima Bean Succotash', steps: ['Adult cooks the lima beans until tender', 'Adult melts butter in a pan over medium heat', 'Adult adds lima beans and corn, cooking 5 minutes, stirring', 'Kid adds a pinch of salt and stirs before serving'] },
  { plantName: 'Lima Beans', name: 'Lima Bean Dip', steps: ['Adult blends or mashes the lima beans until smooth', 'Kid stirs in olive oil, lemon juice, and salt', 'Serve with crackers or veggie sticks for dipping'] },
  { plantName: 'Green Beans', name: 'Green Bean "Log Cabin" Snack', steps: ['Adult steams the green beans for 4 minutes until bright green', 'Kid arranges beans in a crisscross "log cabin" pattern on a plate', 'Kid spoons dip in the center to serve as the "roof" or dipping pool'] },
  { plantName: 'Green Beans', name: 'Garlic Butter Green Beans', steps: ['Adult trims the ends off the green beans', 'Adult steams beans for 5 minutes until tender-crisp', 'Adult melts butter in a pan and adds beans, garlic powder, and salt', 'Kid stirs everything together for 1–2 minutes before serving'] },
  { plantName: 'Green Beans', name: 'Crispy Green Bean Fries', steps: ['Adult trims the green beans', 'Kid dips each bean in beaten egg, then rolls in breadcrumbs and parmesan', 'Adult spreads coated beans on a tray and bakes at 425°F for 12–15 minutes', 'Serve with ketchup or ranch'] },
  { plantName: 'Lettuce', name: 'Lettuce Wrap Tacos', steps: ['Adult washes and separates lettuce leaves', 'Kid spoons turkey or beans into the center of each leaf', 'Kid adds cheese and tomato on top', 'Kid folds the lettuce like a taco to eat'] },
  { plantName: 'Lettuce', name: 'Lettuce Boat Salad', steps: ['Kid washes and dries the lettuce leaves to form little cups', 'Kid fills each cup with cucumber and carrot', 'Kid drizzles a little ranch on top of each boat'] },
  { plantName: 'Lettuce', name: 'Rainbow Lettuce Roll-Ups', steps: ['Kid spreads a thin layer of cream cheese on each lettuce leaf', 'Kid lines up veggie strips along one edge of the leaf', 'Kid rolls the leaf up tightly like a burrito', 'Adult slices in half to serve'] },
  { plantName: 'Kale', name: 'Kale Chips', steps: ['Adult heats oven to 300°F', 'Kid tears kale leaves into chip-sized pieces, removing the tough stems', 'Kid drizzles oil over the leaves and massages gently with hands', 'Kid sprinkles a little salt', "Adult bakes for 15 minutes, checking often so they don't burn"] },
  { plantName: 'Kale', name: 'Kale & Fruit Smoothie', steps: ['Kid tears the kale leaves into the blender', 'Kid adds banana, berries, and milk', 'Adult blends until smooth', 'Pour into cups and enjoy with a straw'] },
  { plantName: 'Kale', name: 'Kale & Cheese Crispy Bites', steps: ['Adult finely chops the kale', 'Kid mixes kale, cheese, and egg in a bowl', 'Kid spoons small mounds onto a lined baking sheet', 'Adult bakes at 375°F for 12–15 minutes until crispy at the edges'] },
  { plantName: 'Spinach', name: 'Green Monster Smoothie', steps: ['Kid adds spinach to the blender', 'Kid adds banana, frozen fruit, and milk', 'Adult blends until smooth and green', 'Pour into cups and enjoy'] },
  { plantName: 'Spinach', name: 'Cheesy Spinach Pinwheels', steps: ['Adult cooks spinach briefly in a pan until wilted, then cools it', 'Kid spreads cream cheese over the pastry sheet', 'Kid sprinkles spinach and cheese evenly on top', 'Kid rolls the pastry into a log', 'Adult slices into pinwheels and bakes at 375°F for 15–18 minutes'] },
  { plantName: 'Spinach', name: 'Spinach & Cheese Quesadilla', steps: ['Kid tears spinach leaves into smaller pieces', 'Kid sprinkles spinach and cheese over half of one tortilla', 'Kid folds the tortilla in half', 'Adult cooks in a pan over medium heat, 2 minutes per side, until cheese melts', 'Adult cuts into wedges to cool'] },
  { plantName: 'Arugula', name: 'Peppery Arugula Pizza Topper', steps: ['Adult bakes the pizza according to instructions', 'Kid washes and dries the arugula leaves', 'Kid scatters arugula on top of the warm (not hot) pizza', 'Kid drizzles a little olive oil over the top before serving'] },
  { plantName: 'Arugula', name: 'Arugula & Fruit Salad', steps: ['Kid washes and dries the arugula', 'Kid mixes arugula and strawberries in a bowl', 'Kid sprinkles cheese on top', 'Kid drizzles honey over everything and tosses gently'] },
  { plantName: 'Arugula', name: 'Arugula Pesto Dip', steps: ['Kid adds arugula, parmesan, and walnuts/seeds to a blender or food processor', 'Adult blends while slowly adding olive oil until smooth', 'Serve as a dip with bread sticks or crackers'] },
];

async function main(): Promise<void> {
  const db = await getDb();
  const existing = await db.query<{ id: number }>(
    'SELECT id FROM users WHERE email = $1',
    ['admin@example.com'],
  );
  if (existing.rowCount) {
    console.log('Demo data already seeded — skipping.');
    return;
  }

  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  const adminId = (
    await db.query<{ id: number }>(
      'INSERT INTO users (role, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      ['admin', 'Demo Admin', 'admin@example.com', hash],
    )
  ).rows[0].id;
  const teacherId = (
    await db.query<{ id: number }>(
      'INSERT INTO users (role, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      ['teacher', 'Demo Teacher', 'teacher@example.com', hash],
    )
  ).rows[0].id;

  const classId = (
    await db.query<{ id: number }>(
      'INSERT INTO classes (name, teacher_id) VALUES ($1, $2) RETURNING id',
      ['Demo Class', teacherId],
    )
  ).rows[0].id;

  const PARENT_QUICK_CODE = 'FOX-123';
  await db.query(
    'INSERT INTO students (display_name, avatar_key, class_id, parent_quick_code) VALUES ($1, $2, $3, $4)',
    ['Demo Student', 'fox', classId, PARENT_QUICK_CODE],
  );

  // Images sourced from Wikimedia Commons (public domain / CC-licensed), resized
  // to 600px and served from frontend/public/images/plants/.
  const plants = [
    {
      name: 'Carrot',
      qrCode: 'CARROT-001',
      imagePath: '/images/plants/carrot.jpg',
      benefitText:
        'Carrots help your eyes see well, especially at night! They also make your skin healthy.',
    },
    {
      name: 'Brussels Sprout',
      qrCode: 'BRUSSELS-SPROUT-001',
      imagePath: '/images/plants/brussels-sprout.jpg',
      benefitText:
        'Brussels sprouts give you vitamins that help your body fight off germs and stay strong!',
    },
    {
      name: 'Tomato',
      qrCode: 'TOMATO-001',
      imagePath: '/images/plants/tomato.jpg',
      benefitText:
        'Tomatoes have vitamin C that helps cuts and scrapes heal faster and keeps your heart happy!',
    },
    {
      name: 'Okra',
      qrCode: 'OKRA-001',
      imagePath: '/images/plants/okra.jpg',
      benefitText:
        'Okra is full of fiber that helps your tummy digest food and keeps you feeling good!',
    },
    {
      name: 'Basil',
      qrCode: 'BASIL-001',
      imagePath: '/images/plants/basil.jpg',
      benefitText:
        'Basil leaves smell amazing and have nutrients that help protect your cells from germs!',
    },
    {
      name: 'Oregano',
      qrCode: 'OREGANO-001',
      imagePath: '/images/plants/oregano.jpg',
      benefitText:
        'Oregano is packed with antioxidants that help keep your whole body healthy!',
    },
    {
      name: 'Thyme',
      qrCode: 'THYME-001',
      imagePath: '/images/plants/thyme.jpg',
      benefitText:
        'Thyme has vitamin C and helps your body fight off coughs and colds!',
    },
    {
      name: 'Parsley',
      qrCode: 'PARSLEY-001',
      imagePath: '/images/plants/parsley.jpg',
      benefitText:
        'Parsley is full of vitamin K, which helps your blood and bones stay strong!',
    },
    {
      name: 'Potato',
      qrCode: 'POTATO-001',
      imagePath: '/images/plants/potato.jpg',
      benefitText:
        'Potatoes give you energy to run and play, plus potassium that keeps your muscles working!',
    },
    {
      name: 'Cantaloupe',
      qrCode: 'CANTALOUPE-001',
      imagePath: '/images/plants/cantaloupe.jpg',
      benefitText:
        'Cantaloupe is full of water and vitamin A, which helps keep your eyes and skin healthy!',
    },
    {
      name: 'Watermelon',
      qrCode: 'WATERMELON-001',
      imagePath: '/images/plants/watermelon.jpg',
      benefitText:
        'Watermelon is mostly water, so it helps keep you cool and hydrated on hot days!',
    },
    {
      name: 'Cauliflower',
      qrCode: 'CAULIFLOWER-001',
      imagePath: '/images/plants/cauliflower.jpg',
      benefitText:
        'Cauliflower has vitamin C that helps your body heal cuts and fight off colds!',
    },
    {
      name: 'Broccoli',
      qrCode: 'BROCCOLI-001',
      imagePath: '/images/plants/broccoli.jpg',
      benefitText:
        'Broccoli is full of vitamin C and fiber that keep your tummy and immune system strong!',
    },
    {
      name: 'Radish',
      qrCode: 'RADISH-001',
      imagePath: '/images/plants/radish.jpg',
      benefitText:
        'Radishes have vitamin C and a crunch that helps keep your gums and teeth healthy!',
    },
    {
      name: 'Swiss Chard',
      qrCode: 'SWISS-CHARD-001',
      imagePath: '/images/plants/swiss-chard.jpg',
      benefitText:
        'Swiss chard is packed with vitamin A and K to help your eyes and bones grow strong!',
    },
    {
      name: 'Zucchini',
      qrCode: 'ZUCCHINI-001',
      imagePath: '/images/plants/zucchini.jpg',
      benefitText:
        'Zucchini has lots of water and potassium that help your muscles work their best!',
    },
    {
      name: 'Bell Pepper',
      qrCode: 'BELL-PEPPER-001',
      imagePath: '/images/plants/bell-pepper.jpg',
      benefitText:
        'Bell peppers have more vitamin C than an orange, helping your body fight off germs!',
    },
    {
      name: 'Jalapeño',
      qrCode: 'JALAPENO-001',
      imagePath: '/images/plants/jalapeno.jpg',
      benefitText:
        'Jalapeños have vitamin C and a little spice that can help warm you up!',
    },
    {
      name: 'Cabbage',
      qrCode: 'CABBAGE-001',
      imagePath: '/images/plants/cabbage.jpg',
      benefitText:
        'Cabbage is full of vitamin K and C that help your blood and skin stay healthy!',
    },
    {
      name: 'Beans',
      qrCode: 'BEANS-001',
      imagePath: '/images/plants/beans.jpg',
      benefitText:
        'Beans are packed with protein and fiber that give you energy and keep your tummy happy!',
    },
    {
      name: 'Lima Beans',
      qrCode: 'LIMA-BEANS-001',
      imagePath: '/images/plants/lima-beans.jpg',
      benefitText:
        'Lima beans have protein and iron that help your muscles grow strong and your blood stay healthy!',
    },
    {
      name: 'Green Beans',
      qrCode: 'GREEN-BEANS-001',
      imagePath: '/images/plants/green-beans.jpg',
      benefitText:
        'Green beans have vitamin K and fiber that help your bones and digestion stay healthy!',
    },
    {
      name: 'Lettuce',
      qrCode: 'LETTUCE-001',
      imagePath: '/images/plants/lettuce.jpg',
      benefitText:
        'Lettuce is full of water and vitamin A that help keep you hydrated and your eyes sharp!',
    },
    {
      name: 'Kale',
      qrCode: 'KALE-001',
      imagePath: '/images/plants/kale.jpg',
      benefitText:
        'Kale is packed with vitamins A, C, and K that help your whole body stay strong!',
    },
    {
      name: 'Spinach',
      qrCode: 'SPINACH-001',
      imagePath: '/images/plants/spinach.jpg',
      benefitText:
        'Spinach has iron that helps carry oxygen in your blood, just like Popeye taught us!',
    },
    {
      name: 'Arugula',
      qrCode: 'ARUGULA-001',
      imagePath: '/images/plants/arugula.jpg',
      benefitText:
        'Arugula has calcium and vitamin K that help build strong bones as you grow!',
    },
  ];

  const plantIdsByName = new Map<string, number>();
  for (const plant of plants) {
    const id = (
      await db.query<{ id: number }>(
        `INSERT INTO plants (name, qr_code, image_path, benefit_text, is_published, created_by)
         VALUES ($1, $2, $3, $4, TRUE, $5) RETURNING id`,
        [plant.name, plant.qrCode, plant.imagePath, plant.benefitText, adminId],
      )
    ).rows[0].id;
    await db.query(
      'INSERT INTO garden_selections (class_id, plant_id, selected_by) VALUES ($1, $2, $3)',
      [classId, id, teacherId],
    );
    plantIdsByName.set(plant.name, id);
  }

  // Seed all recipes (published, no step images needed — bypasses the
  // publish-route field-gate the same way plants do above).
  let recipeCount = 0;
  for (const recipe of recipeSeeds) {
    const plantId = plantIdsByName.get(recipe.plantName);
    if (!plantId) {
      console.warn(`  skipping recipe "${recipe.name}" — no matching plant "${recipe.plantName}"`);
      continue;
    }
    const recipeId = (
      await db.query<{ id: number }>(
        'INSERT INTO recipes (name, is_published, created_by) VALUES ($1, TRUE, $2) RETURNING id',
        [recipe.name, adminId],
      )
    ).rows[0].id;
    await db.query('INSERT INTO recipe_plants (recipe_id, plant_id) VALUES ($1, $2)', [recipeId, plantId]);
    for (const [index, step] of recipe.steps.entries()) {
      await db.query(
        'INSERT INTO recipe_steps (recipe_id, step_order, step_text) VALUES ($1, $2, $3)',
        [recipeId, index + 1, step],
      );
    }
    recipeCount += 1;
  }

  console.log('Seeded demo data:');
  console.log(`  admin login:   admin@example.com / ${DEMO_PASSWORD}`);
  console.log(`  teacher login: teacher@example.com / ${DEMO_PASSWORD}`);
  console.log('  student login: pick "Demo Student" from the student picker (no password)');
  console.log(`  parent login:  quick code ${PARENT_QUICK_CODE} (links "Demo Student")`);
  console.log(`  demo plants:   ${plants.length} (published, in garden selection)`);
  console.log(`  demo recipes:  ${recipeCount} (published, kid-friendly steps, no step images)`);
}

void main()
  .catch((error: unknown) => {
    console.error('Failed to seed demo data', error);
    process.exitCode = 1;
  })
  .finally(closeDb);
