import { input, password } from "@inquirer/prompts";

import { pamAuthenticate } from "node-linux-pam";

async function main() {
  const username = await input({ message: "Username:" });
  const passwordVal = await password({ message: "Password:" });
  
  const result = await new Promise((resolve, reject) => {
    pamAuthenticate({ username, password: passwordVal }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
  console.log(result);
}

main();
