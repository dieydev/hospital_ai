FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["services/HospitalAI.Gateway/HospitalAI.Gateway.csproj", "services/HospitalAI.Gateway/"]
RUN dotnet restore "services/HospitalAI.Gateway/HospitalAI.Gateway.csproj"
COPY . .
WORKDIR "/src/services/HospitalAI.Gateway"
RUN dotnet build "HospitalAI.Gateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HospitalAI.Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HospitalAI.Gateway.dll"]
