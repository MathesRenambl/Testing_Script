import { Credentials } from './index.js'
import { addCharges } from './addCharges.js'


const main = async () => {
    const arg = process.argv[2]; // Get the first argument after "node main"

    switch (arg) {
        case 'create-shop':
            await Credentials();
            break;
        case 'add-charges':
            await addCharges();
            break;
        default:
            console.log('Usage: node main [Credentials|addCharges]');
    }
}
main()