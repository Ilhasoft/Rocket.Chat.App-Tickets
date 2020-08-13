# Tickets

## About
Tickets is a [Rocket.Chat](https://github.com/RocketChat/Rocket.Chat) app to enable the integration between [<ins>**rapidpro**</ins>](https://github.com/rapidpro/rapidpro) ticketing service and the Rocket.Chat Omnichannel(Livechat) feature.

## Installation

1. Clone the repository and change directory:
```bash=
    git clone https://github.com/Ilhasoft/Rocket.Chat.App-Tickets
    cd Rocket.Chat.App-Tickets
```
2. Install the required packages:
```bash=
    npm install
```
3. Deploy the App:

```bash=
    rc-apps deploy
```

- Then the CLI will prompt you to insert:
    - `Server's URL`: Is your Rocket.Chat instance URL (if running Rocket.Chat locally,  insert `localhost:<PORT>`)
    - `username`: Is the username of the Rocket.Chat admin
    - `password`: Is the password of the Rocket.Chat admin

Refer to this [guide](https://docs.rocket.chat/apps-development/getting-started) if you need more info.

## App Setup

1. With the App installed, and with the `app_secret` provided on the Rocket.Chat ticket service integration setup on rapidpro, go to `Administration > Apps > Tickets`, and paste the `app_secret` on the `App Secret` field, then click `Save Changes`.

3. Return to rapidpro, and proceed with the integration setup after setting the `App Secret` field. This will automaticaly validate the integration between the App and rapidpro.

## API Reference

The app currently supports 5 different endpoints.

#### The following headers are required in for all incoming requests to ensure the requests being made from the intended rapidpro integration.

```json=
Content-Type:  application/json
Authorization: Token PMgASmAH4ktSXG97
```

- ### GET /secret.check
    - Description:
        - Match the given secret from `Authorization` header with the App's `App Secret` field.
    - Result:
        - Status: `204 No Content`

- ### PUT /settings

    - Description: 
        - Sets the given settings on app.
    - Currently supported settings:
        - `webhook`
    - Payload example:
        ```json=
        {
            "webhook": {
                "url": "https://<host>/mr/tickets/types/rocketchat/<UUID>/event"
            }
        }
        ```
    - Result:
        - Status: `204 No Content`

- ### GET /room
    - Description:
        - Creates a livechat room to the given visitor
    - Payload example:
        ```json=
        {
            "ticketId": "11137eb1-c831-4ddc-ba26-0bb77837f15e",
            "priority": "high",
            "sessionStart": "2020-07-17 10:28",
            "visitor": {
                "token": "1234"
                "contactUuid": "88ff1e41-c1f8-4637-af8e-d56acbde9171",
                "deparment": "Foo",
                "name": "John Doe",
                "email": "john.doe@mail.com",
                "phone": "+15417543010",
                "customFields": {
                    "foo": "bar",
                    "bar": "foo",
                }
            }
        }
        ``` 
    - Result:
        - Status: `200 OK`
        - Body:
        ```json=
        {
            "id": "onrMgdKbpX9Qqtvoi"
        }
        ```
        
- ### GET /room.close

    - Description:
        - Closes the livechat room from the given visitor.
    - Payload example:
        ```json=
        {
            "visitor": {
                "token": "1234",
            }
        }
        ```
    - Result:
        - Status: `204 No Content`

- ### POST /visitor-message
    - Description:
        - Receives the visitor message and forwards to its assigned agent.
    - Payload example:
        ```json=
        {
            "visitor": {
                "token": "1234",
            },
            "text": "Hi!"
        }
        ```
    - Result:
        - Status: `201 Created`
        - Body:
        ```json=
        {
            "id": "iNKE8a6k6cjbqWhWd"
        }
        ```

## Webhooks Reference

There are currently 2 configured webhooks on the App.

#### The following headers are required in for all webhooks to ensure the requests are being made from the intended rapidpro integration.

```json=
Content-Type:  application/json
Authorization: Token PMgASmAH4ktSXG97
```

#### POST <callback_url>
    
- Agent Message:
    - Description:
        - Triggered when the agent sends a message to the visitor.
    - Payload:
        ```json=
        {
            "type": "agent-message",
            "ticketId": "11137eb1-c831-4ddc-ba26-0bb77837f15e",
            "visitor": {
                "token": "1234"
            },
            "data": {
                "text": "",
            }
        }
        ``` 
- Close:
    - Description:
        - Triggered when a livechat room is closed.
    - Payload:
        ```json=
        {
            "type": "close-room",
            "ticketId": "11137eb1-c831-4ddc-ba26-0bb77837f15e",
            "visitor": {
                "token": "1234",
            }
        }
        ```
