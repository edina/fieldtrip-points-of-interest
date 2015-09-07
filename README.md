Fieldtrip - Points of Interest Plugin
=======================================

## Requirements

- fieldtrip-sync plugin

## Install

Add the following line to your project plugin list

```
"points-of-interest": "git@github.com:edina/fieldtrip-points-of-interest.git"
```

## Format

It is expected a geoJSON file containing a FeatureCollection with some extra properties.

- An id an name for the collection, the name will be shown in the list of layers on the map
- Each feature shoudl contain an id, title, text and an action

## Example

```
{
  "type": "FeatureCollection",
  "properties": {
    "id": "d45dd517-8a29-44a4-bc44-8e0afd9372b3",
    "name": "Causewayside"
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 1,
        "title": "EDINA",
        "text": "160 Causewayside",
        "action": {
          "method": "open",
          "params": {
            "type": "editor",
            "name": "causewayside.edtr"
          }
        }
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -3.1803810596466064,
          55.936188671991175
        ]
      }
    }
  ]
}
```
