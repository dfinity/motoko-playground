let upstream = https://github.com/kritzcreek/vessel-package-set/releases/download/mo-0.6.4-20210624/package-set.dhall sha256:3f4cffd315d8ee5d2b4b5b00dc03b2e02732345b565340b7cb9cc0001444f525
let Package =
    { name : Text, version : Text, repo : Text, dependencies : List Text }

let
  -- This is where you can add your own packages to the package-set
  additions =
      [{ name = "base"
      , repo = "https://github.com/dfinity/motoko-base"
      , version = "dfx-0.7.0"
      , dependencies = [] : List Text
      }] : List Package

let
  {- This is where you can override existing packages in the package-set

     For example, if you wanted to use version `v2.0.0` of the foo library:
     let overrides = [
         { name = "foo"
         , version = "v2.0.0"
         , repo = "https://github.com/bar/foo"
         , dependencies = [] : List Text
         }
     ]
  -}
  overrides =
    [] : List Package

in  upstream # additions # overrides
