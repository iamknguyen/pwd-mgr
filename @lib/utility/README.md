### Utility

## Deploy 

The deploy it works the same way the shell scripts do but it uses 1 config.json so you just have to mess with the config json then run the cli. to add a lambda you just add on an object to the applications, it’ll pick up the cli options and add it. i.e.
inside of the acecloud.config.json add your applications
```
{
  "name": "myLambda",
  "type": "lambda",
  "cliOption": "mlamb",
  "projectPath": "/this/is optional for now, im working on getting the deploy build pipeline and deploy pipeline with cdk to work",
  "tagPrefix": "mylambda",
  "ssmName": "/service/pipeline/deploy/mylambda/version"
}
```
then to run, which you’ll see in the cli, you can run `yarn deploy -a mlamb -e dev,qa -v latest`
