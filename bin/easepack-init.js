var program = require('commander');
var download = require('download');

var regex = /^((github|gitlab|bitbucket):)?((.+):)?([^/]+)\/([^#]+)(#(.+))?$/;

program
  .usage('<template-name> [project-name]')
  .option('--offline', 'use cached template')
  .parse(process.argv);

var template = program.args[0];

function exists() {
}

function normalize(repo) {
  var match = regex.exec(repo);
  var type = match[2] || "github";
  var host = match[4] || null;
  var owner = match[5];
  var name = match[6];
  var checkout = match[8] || "master";

  if (host == null) {
    if (type === "github")
      host = "github.com";
    else if (type === "gitlab")
      host = "gitlab.com";
    else if (type === "bitbucket")
      host = "bitbucket.com";
  }

  return {
    type: type,
    host: host,
    owner: owner,
    name: name,
    checkout: checkout
  };
}

function getUrl(repo, clone) {
  var url;

  if (repo.type === "github")
    url = github(repo, clone);
  else if (repo.type === "gitlab")
    url = gitlab(repo, clone);
  else if (repo.type === "bitbucket")
    url = bitbucket(repo, clone);
  else
    url = github(repo, clone);

  return url;
}

function github(repo, clone) {
  var url;

  if (clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = "https://" + repo.host + "/" + repo.owner + "/" + repo.name + "/archive/" + repo.checkout + ".zip";

  return url;
}

function gitlab(repo, clone) {
  var url;

  if (clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = "https://" + repo.host + "/" + repo.owner + "/" + repo.name + "/repository/archive.zip?ref=" + repo.checkout;

  return url;
}

function bitbucket(repo, clone) {
  var url;

  if (clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = "https://" + repo.host + "/" + repo.owner + "/" + repo.name + "/get/" + repo.checkout + ".zip";

  return url;
}