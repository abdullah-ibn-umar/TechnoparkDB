FROM ubuntu:18.04
MAINTAINER Tulforov Jahongir

ENV PGVER 11
ENV PORT 5000
EXPOSE $PORT

RUN apt-get update
RUN apt-get install -y curl gnupg2

RUN apt-get install -y wget && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt bionic-pgdg main" > /etc/apt/sources.list.d/PostgreSQL.list

RUN apt-get update

RUN curl -sL https://deb.nodesource.com/setup_11.x | bash
RUN apt-get install -y nodejs
RUN apt-get install -y postgresql-$PGVER

RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/$PGVER/main/pg_hba.conf
RUN echo "listen_addresses='*'" >> /etc/postgresql/$PGVER/main/postgresql.conf

COPY ./ /opt/technopark-db/

USER postgres
RUN service postgresql start &&\
    psql --command "CREATE USER jahongir WITH SUPERUSER PASSWORD 'Password1234';" &&\
    psql < /opt/technopark-db/forum.sql &&\
    service postgresql stop

VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

USER root
WORKDIR /opt/technopark-db
RUN npm install --only=production

CMD service postgresql start && npm start
